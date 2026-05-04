import type { Role } from "./contracts";

type AccessContext = {
  userId: string;
  roles: Role[];
  userOrganizationIds: string[];
  assignedTeamIds?: string[];
  linkedPlayerIds?: string[];
  consentGranted?: boolean;
};

type ResourceContext = {
  organizationId: string;
  teamId?: string;
  playerId?: string;
  requiresConsent?: boolean;
};

const platformRoles = new Set<Role>(["platform_admin"]);
const organizationAdminRoles = new Set<Role>(["org_admin"]);
const teamRoles = new Set<Role>(["team_coach", "assistant_coach", "evaluator"]);
const guardianPlayerRoles = new Set<Role>(["guardian", "player"]);

export function hasTenantAccess(user: AccessContext, resource: ResourceContext): boolean {
  if (user.roles.some((role) => platformRoles.has(role))) {
    return true;
  }

  return user.userOrganizationIds.includes(resource.organizationId);
}

export function canReadPlayer(user: AccessContext, resource: ResourceContext): boolean {
  if (!resource.playerId || !hasTenantAccess(user, resource)) {
    return false;
  }

  if (resource.requiresConsent && !user.consentGranted) {
    return false;
  }

  if (user.roles.some((role) => platformRoles.has(role) || organizationAdminRoles.has(role))) {
    return true;
  }

  if (
    resource.teamId &&
    user.assignedTeamIds?.includes(resource.teamId) &&
    user.roles.some((role) => teamRoles.has(role))
  ) {
    return true;
  }

  return Boolean(
    user.linkedPlayerIds?.includes(resource.playerId) &&
      user.roles.some((role) => guardianPlayerRoles.has(role))
  );
}

export function canManageOrganization(user: AccessContext, organizationId: string): boolean {
  if (user.roles.includes("platform_admin")) {
    return true;
  }

  return user.roles.includes("org_admin") && user.userOrganizationIds.includes(organizationId);
}

export function canManagePlatform(user: AccessContext): boolean {
  return user.roles.includes("platform_admin");
}

export function canManageConsent(
  user: AccessContext,
  resource: Required<Pick<ResourceContext, "organizationId" | "playerId">> & { guardianUserId: string }
): boolean {
  if (!hasTenantAccess(user, resource)) {
    return false;
  }

  if (user.roles.some((role) => platformRoles.has(role) || organizationAdminRoles.has(role))) {
    return true;
  }

  return Boolean(
    user.userId === resource.guardianUserId &&
      user.linkedPlayerIds?.includes(resource.playerId) &&
      user.roles.includes("guardian")
  );
}

export function canActForOrganizationUser(
  user: AccessContext,
  resource: Required<Pick<ResourceContext, "organizationId">> & { targetUserId: string }
): boolean {
  if (!hasTenantAccess(user, resource)) {
    return false;
  }

  if (user.roles.some((role) => platformRoles.has(role) || organizationAdminRoles.has(role))) {
    return true;
  }

  return user.userId === resource.targetUserId;
}

export function canEnterTeamData(
  user: AccessContext,
  resource: Required<Pick<ResourceContext, "organizationId" | "teamId">>
): boolean {
  if (!hasTenantAccess(user, resource)) {
    return false;
  }

  if (user.roles.some((role) => role === "org_admin" || role === "platform_admin")) {
    return true;
  }

  return Boolean(
    user.assignedTeamIds?.includes(resource.teamId) &&
      user.roles.some((role) => role === "team_coach" || role === "assistant_coach" || role === "evaluator")
  );
}

export function canEnterPlayerData(
  user: AccessContext,
  resource: Required<Pick<ResourceContext, "organizationId" | "playerId">> &
    Pick<ResourceContext, "teamId" | "requiresConsent"> & {
      allowLinkedUserEntry?: boolean;
    }
): boolean {
  if (!hasTenantAccess(user, resource)) {
    return false;
  }

  if (resource.requiresConsent && !user.consentGranted) {
    return false;
  }

  if (user.roles.some((role) => platformRoles.has(role) || organizationAdminRoles.has(role))) {
    return true;
  }

  if (
    resource.teamId &&
    user.assignedTeamIds?.includes(resource.teamId) &&
    user.roles.some((role) => teamRoles.has(role))
  ) {
    return true;
  }

  if (!resource.teamId && user.roles.includes("evaluator")) {
    return true;
  }

  return Boolean(
    resource.allowLinkedUserEntry &&
      user.linkedPlayerIds?.includes(resource.playerId) &&
      user.roles.some((role) => guardianPlayerRoles.has(role))
  );
}
