import { apiErrorResponse } from "./api-response";
import {
  canEnterTeamData,
  canEnterPlayerData,
  canActForOrganizationUser,
  canManageConsent,
  canManageOrganization,
  canManagePlatform,
  canReadPlayer,
  hasTenantAccess
} from "./authorization";
import { getRequestAccessContext, shouldEnforceAuth } from "./request-auth";

type PlayerResource = {
  organizationId: string;
  playerId: string;
  teamId?: string;
  requiresConsent?: boolean;
};

type TeamResource = {
  organizationId: string;
  teamId: string;
};

type ConsentResource = {
  organizationId: string;
  playerId: string;
  guardianUserId: string;
};

type OrganizationUserResource = {
  organizationId: string;
  targetUserId: string;
};

export function requirePlayerAccess(headers: Headers, resource: PlayerResource) {
  if (!shouldEnforceAuth()) {
    return null;
  }

  const user = getRequestAccessContext(headers);

  if (!user) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!canReadPlayer(user, resource)) {
    return apiErrorResponse("FORBIDDEN", "You do not have access to this player resource.", 403);
  }

  return null;
}

export function requireTeamEntryAccess(headers: Headers, resource: TeamResource) {
  if (!shouldEnforceAuth()) {
    return null;
  }

  const user = getRequestAccessContext(headers);

  if (!user) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!canEnterTeamData(user, resource)) {
    return apiErrorResponse("FORBIDDEN", "You do not have access to enter data for this team.", 403);
  }

  return null;
}

export function requirePlayerDataEntryAccess(
  headers: Headers,
  resource: PlayerResource & { allowLinkedUserEntry?: boolean }
) {
  if (!shouldEnforceAuth()) {
    return null;
  }

  const user = getRequestAccessContext(headers);

  if (!user) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!canEnterPlayerData(user, resource)) {
    return apiErrorResponse("FORBIDDEN", "You do not have access to enter data for this player.", 403);
  }

  return null;
}

export function requireTenantAccess(headers: Headers, organizationId: string) {
  if (!shouldEnforceAuth()) {
    return null;
  }

  const user = getRequestAccessContext(headers);

  if (!user) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!hasTenantAccess(user, { organizationId })) {
    return apiErrorResponse("FORBIDDEN", "You do not have access to this organization.", 403);
  }

  return null;
}

export function requireOrganizationManagementAccess(headers: Headers, organizationId: string) {
  if (!shouldEnforceAuth()) {
    return null;
  }

  const user = getRequestAccessContext(headers);

  if (!user) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!canManageOrganization(user, organizationId)) {
    return apiErrorResponse("FORBIDDEN", "You do not have permission to manage this organization.", 403);
  }

  return null;
}

export function requirePlatformAdmin(headers: Headers) {
  if (!shouldEnforceAuth()) {
    return null;
  }

  const user = getRequestAccessContext(headers);

  if (!user) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!canManagePlatform(user)) {
    return apiErrorResponse("FORBIDDEN", "Platform admin access is required.", 403);
  }

  return null;
}

export function requireConsentRecordAccess(headers: Headers, resource: ConsentResource) {
  if (!shouldEnforceAuth()) {
    return null;
  }

  const user = getRequestAccessContext(headers);

  if (!user) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!canManageConsent(user, resource)) {
    return apiErrorResponse("FORBIDDEN", "You do not have permission to manage consent for this player.", 403);
  }

  return null;
}

export function requireOrganizationUserAction(headers: Headers, resource: OrganizationUserResource) {
  if (!shouldEnforceAuth()) {
    return null;
  }

  const user = getRequestAccessContext(headers);

  if (!user) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!canActForOrganizationUser(user, resource)) {
    return apiErrorResponse("FORBIDDEN", "You cannot act for this organization user.", 403);
  }

  return null;
}
