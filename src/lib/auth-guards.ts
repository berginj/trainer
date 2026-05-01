import { apiErrorResponse } from "./api-response";
import { canEnterTeamData, canReadPlayer, hasTenantAccess } from "./authorization";
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
