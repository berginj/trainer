import type { AuthProvider, PrismaClient, UserProfile } from "@prisma/client";
import type { Role } from "./contracts";
import { hashInvitationToken } from "./auth-session";
import type { RequestAccessContext } from "./request-auth";

type OAuthProfile = {
  provider: AuthProvider;
  subject: string;
  email: string;
  displayName: string;
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function claimPendingInvitations(input: {
  prisma: PrismaClient;
  user: UserProfile;
  email: string;
  inviteToken?: string;
}) {
  const email = normalizeEmail(input.email);
  const tokenHash = input.inviteToken ? hashInvitationToken(input.inviteToken) : undefined;
  const invitations = await input.prisma.invitation.findMany({
    where: {
      status: "pending",
      email,
      OR: [
        { expiresAt: null },
        {
          expiresAt: {
            gt: new Date()
          }
        }
      ],
      ...(tokenHash ? { tokenHash } : {})
    }
  });

  for (const invitation of invitations) {
    await input.prisma.$transaction(async (tx) => {
      await tx.organizationMembership.upsert({
        where: {
          organizationId_userId_role: {
            organizationId: invitation.organizationId,
            userId: input.user.id,
            role: invitation.role
          }
        },
        create: {
          organizationId: invitation.organizationId,
          userId: input.user.id,
          role: invitation.role,
          status: "active"
        },
        update: {
          status: "active"
        }
      });

      if (invitation.teamId && ["team_coach", "assistant_coach", "evaluator"].includes(invitation.role)) {
        await tx.teamMembership.upsert({
          where: {
            teamId_userId_role: {
              teamId: invitation.teamId,
              userId: input.user.id,
              role: invitation.role
            }
          },
          create: {
            organizationId: invitation.organizationId,
            teamId: invitation.teamId,
            userId: input.user.id,
            role: invitation.role,
            status: "active"
          },
          update: {
            status: "active"
          }
        });
      }

      if (invitation.playerId && (invitation.role === "guardian" || invitation.role === "player")) {
        await tx.guardianPlayerLink.upsert({
          where: {
            guardianUserId_playerId: {
              guardianUserId: input.user.id,
              playerId: invitation.playerId
            }
          },
          create: {
            guardianUserId: input.user.id,
            playerId: invitation.playerId,
            relationship: invitation.role === "player" ? "self" : (invitation.relationship ?? "guardian"),
            status: "active"
          },
          update: {
            relationship: invitation.role === "player" ? "self" : (invitation.relationship ?? "guardian"),
            status: "active"
          }
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "accepted",
          acceptedById: input.user.id,
          acceptedAt: new Date()
        }
      });
    });
  }
}

export async function upsertOAuthUser(input: {
  prisma: PrismaClient;
  profile: OAuthProfile;
  inviteToken?: string;
}) {
  const email = normalizeEmail(input.profile.email);
  const externalIdentityId = `${input.profile.provider}:${input.profile.subject}`;
  const existingIdentity = await input.prisma.authIdentity.findUnique({
    where: {
      provider_providerSubject: {
        provider: input.profile.provider,
        providerSubject: input.profile.subject
      }
    },
    include: { user: true }
  });

  const user =
    existingIdentity?.user ??
    (await input.prisma.userProfile.upsert({
      where: { email },
      create: {
        externalIdentityId,
        email,
        displayName: input.profile.displayName
      },
      update: {
        displayName: input.profile.displayName
      }
    }));

  await input.prisma.authIdentity.upsert({
    where: {
      provider_providerSubject: {
        provider: input.profile.provider,
        providerSubject: input.profile.subject
      }
    },
    create: {
      userId: user.id,
      provider: input.profile.provider,
      providerSubject: input.profile.subject,
      email
    },
    update: {
      email
    }
  });

  await claimPendingInvitations({
    prisma: input.prisma,
    user,
    email,
    inviteToken: input.inviteToken
  });

  return user;
}

export async function buildAccessContext(prisma: PrismaClient, userId: string): Promise<RequestAccessContext> {
  const user = await prisma.userProfile.findUniqueOrThrow({
    where: { id: userId },
    include: {
      memberships: {
        where: { status: "active" }
      },
      teamMemberships: {
        where: { status: "active" }
      },
      guardianLinks: {
        where: { status: "active" }
      }
    }
  });
  const roles = unique([
    ...user.memberships.map((membership) => membership.role),
    ...user.teamMemberships.map((membership) => membership.role)
  ]) as Role[];
  const linkedPlayerIds = unique(user.guardianLinks.map((link) => link.playerId));
  const selfLinkedPlayerIds = unique(
    user.guardianLinks.filter((link) => link.relationship === "self").map((link) => link.playerId)
  );
  const activeConsentRecords =
    linkedPlayerIds.length === 0
      ? []
      : await prisma.consentRecord.findMany({
          where: {
            guardianUserId: user.id,
            playerId: { in: linkedPlayerIds },
            status: "granted"
          },
          select: {
            playerId: true
          }
        });
  const consentGrantedPlayerIds = unique(activeConsentRecords.map((record) => record.playerId));

  return {
    userId: user.id,
    roles,
    userOrganizationIds: unique(user.memberships.map((membership) => membership.organizationId)),
    assignedTeamIds: unique(user.teamMemberships.map((membership) => membership.teamId)),
    linkedPlayerIds,
    consentGrantedPlayerIds,
    consentGranted:
      roles.some((role) =>
        ["platform_admin", "org_admin", "team_coach", "assistant_coach", "evaluator"].includes(role)
      ) ||
      (roles.includes("player") && selfLinkedPlayerIds.length > 0) ||
      consentGrantedPlayerIds.length > 0
  };
}
