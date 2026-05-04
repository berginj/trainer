import { roleSchema, type Role } from "./contracts";

export type RequestAccessContext = {
  userId: string;
  roles: Role[];
  userOrganizationIds: string[];
  assignedTeamIds: string[];
  linkedPlayerIds: string[];
  consentGranted: boolean;
};

function splitHeader(value: string | null) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

export function getRequestAccessContext(headers: Headers): RequestAccessContext | null {
  const userId = headers.get("x-user-id");

  if (!userId) {
    return null;
  }

  const parsedRoles = splitHeader(headers.get("x-roles")).map((role) => roleSchema.safeParse(role));

  if (parsedRoles.some((role) => !role.success)) {
    return null;
  }

  return {
    userId,
    roles: parsedRoles.flatMap((role) => (role.success ? [role.data] : [])),
    userOrganizationIds: splitHeader(headers.get("x-org-ids")),
    assignedTeamIds: splitHeader(headers.get("x-team-ids")),
    linkedPlayerIds: splitHeader(headers.get("x-player-ids")),
    consentGranted: headers.get("x-consent-granted") === "true"
  };
}

export function shouldEnforceAuth() {
  return process.env.AUTH_ENFORCEMENT === "on";
}

export function getRequestActorId(headers: Headers, fallbackActorId?: string | null) {
  const context = getRequestAccessContext(headers);

  if (shouldEnforceAuth()) {
    return context?.userId ?? null;
  }

  return fallbackActorId ?? context?.userId ?? null;
}
