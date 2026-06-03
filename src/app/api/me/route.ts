import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse } from "@/lib/api-response";
import { buildAccessContext } from "@/lib/app-auth";
import type { Role } from "@/lib/contracts";
import { getPrisma } from "@/lib/db";
import { getRequestAccessContext } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PersonaKind = "administrator" | "coach" | "parent" | "athlete";

type Persona = {
  kind: PersonaKind;
  label: string;
  href: string;
  primary: boolean;
};

type NextAction = {
  persona: PersonaKind;
  label: string;
  href: string;
  priority: number;
};

const adminRoles = new Set<Role>(["platform_admin", "org_admin"]);
const coachRoles = new Set<Role>(["team_coach", "assistant_coach", "evaluator"]);

function hasAnyRole(roles: Role[], roleSet: Set<Role>) {
  return roles.some((role) => roleSet.has(role));
}

function buildPersonas(input: { roles: Role[]; teamCount: number; linkedPlayerCount: number }) {
  const personas: Omit<Persona, "primary">[] = [];

  if (hasAnyRole(input.roles, adminRoles)) {
    personas.push({ kind: "administrator", label: "Administrator", href: "/admin" });
  }

  if (hasAnyRole(input.roles, coachRoles) && input.teamCount > 0) {
    personas.push({ kind: "coach", label: "Coach", href: "/dashboards/team" });
  }

  if (input.roles.includes("guardian") && input.linkedPlayerCount > 0) {
    personas.push({ kind: "parent", label: "Parent / Guardian", href: "/guardian/home" });
  }

  if (input.roles.includes("player") && input.linkedPlayerCount > 0) {
    personas.push({ kind: "athlete", label: "Athlete", href: "/athlete/home" });
  }

  const primaryKind = personas.find((persona) => persona.kind === "parent")?.kind ?? personas[0]?.kind;

  return personas.map((persona) => ({
    ...persona,
    primary: persona.kind === primaryKind
  }));
}

function buildNextActions(personas: Persona[]): NextAction[] {
  const actions: NextAction[] = [];

  for (const persona of personas) {
    if (persona.kind === "administrator") {
      actions.push(
        { persona: persona.kind, label: "Review launch readiness", href: "/admin", priority: 1 },
        { persona: persona.kind, label: "Fix roster and guardian gaps", href: "/roster", priority: 2 },
        { persona: persona.kind, label: "Open reports", href: "/reports", priority: 3 },
        { persona: persona.kind, label: "Open internal workflows", href: "/workflows", priority: 4 }
      );
      continue;
    }

    if (persona.kind === "coach") {
      actions.push(
        { persona: persona.kind, label: "Open Team Today", href: "/dashboards/team", priority: 1 },
        { persona: persona.kind, label: "Add players or guardian invites", href: "/roster", priority: 2 },
        { persona: persona.kind, label: "Assign or adjust routines", href: "/routines", priority: 3 },
        { persona: persona.kind, label: "Generate or review reports", href: "/reports", priority: 4 }
      );
      continue;
    }

    if (persona.kind === "parent") {
      actions.push(
        { persona: persona.kind, label: "Open parent home", href: "/guardian/home", priority: 1 },
        { persona: persona.kind, label: "Open athlete co-view", href: "/athlete/home?mode=child", priority: 2 },
        { persona: persona.kind, label: "Review latest reports", href: "/reports", priority: 3 }
      );
      continue;
    }

    actions.push(
      { persona: persona.kind, label: "Open athlete home", href: "/athlete/home", priority: 1 },
      { persona: persona.kind, label: "Review my reports", href: "/reports", priority: 2 },
      { persona: persona.kind, label: "Open player detail", href: "/dashboards/player", priority: 3 }
    );
  }

  return actions;
}

export async function GET(request: NextRequest) {
  const context = getRequestAccessContext(request.headers);

  if (!context) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  const prisma = getPrisma();
  const [freshContext, user] = await Promise.all([
    buildAccessContext(prisma, context.userId),
    prisma.userProfile.findUnique({
      where: { id: context.userId },
      include: {
        memberships: {
          include: {
            organization: true
          }
        },
        teamMemberships: {
          include: {
            team: true
          }
        },
        guardianLinks: {
          include: {
            player: {
              include: {
                teamPlayers: {
                  include: {
                    team: true
                  }
                }
              }
            }
          }
        }
      }
    })
  ]);

  if (!user) {
    return apiErrorResponse("NOT_FOUND", "User was not found.", 404);
  }

  const managedOrganizationIds = user.memberships
    .filter((membership) => adminRoles.has(membership.role))
    .map((membership) => membership.organizationId);
  const managedTeams =
    managedOrganizationIds.length > 0
      ? await prisma.team.findMany({
          where: {
            organizationId: { in: managedOrganizationIds },
            activeStatus: "active"
          },
          orderBy: { name: "asc" }
        })
      : [];
  const teamSummariesById = new Map<
    string,
    {
      id: string;
      organizationId: string;
      name: string;
      role: Role;
      brand: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        logoUrl: string | null;
      };
    }
  >();

  for (const membership of user.teamMemberships) {
    teamSummariesById.set(membership.teamId, {
      id: membership.teamId,
      organizationId: membership.team.organizationId,
      name: membership.team.brandDisplayName ?? membership.team.name,
      role: membership.role,
      brand: {
        primaryColor: membership.team.brandPrimaryColor,
        secondaryColor: membership.team.brandSecondaryColor,
        accentColor: membership.team.brandAccentColor,
        logoUrl: membership.team.brandLogoUrl
      }
    });
  }

  for (const team of managedTeams) {
    if (teamSummariesById.has(team.id)) {
      continue;
    }

    teamSummariesById.set(team.id, {
      id: team.id,
      organizationId: team.organizationId,
      name: team.brandDisplayName ?? team.name,
      role: "org_admin",
      brand: {
        primaryColor: team.brandPrimaryColor,
        secondaryColor: team.brandSecondaryColor,
        accentColor: team.brandAccentColor,
        logoUrl: team.brandLogoUrl
      }
    });
  }

  const linkedPlayers = user.guardianLinks.map((link) => ({
    id: link.playerId,
    preferredName: link.player.preferredName,
    relationship: link.relationship,
    teams: link.player.teamPlayers.map(({ team }) => ({
      id: team.id,
      name: team.brandDisplayName ?? team.name,
      brand: {
        primaryColor: team.brandPrimaryColor,
        secondaryColor: team.brandSecondaryColor,
        accentColor: team.brandAccentColor,
        logoUrl: team.brandLogoUrl
      }
    }))
  }));
  const personas = buildPersonas({
    roles: freshContext.roles,
    teamCount: teamSummariesById.size,
    linkedPlayerCount: linkedPlayers.length
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    },
    access: freshContext,
    organizations: user.memberships.map((membership) => ({
      id: membership.organizationId,
      name: membership.organization.name,
      role: membership.role,
      status: membership.status
    })),
    teams: Array.from(teamSummariesById.values()),
    linkedPlayers,
    personas,
    nextActions: buildNextActions(personas)
  });
}
