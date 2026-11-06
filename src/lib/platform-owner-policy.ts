import type { AppRole } from "@/lib/types";

type AuthorityUser = { appRole: AppRole; isActive: boolean; isPlatformOwner: boolean };
type AuthorityPatch = { appRole?: AppRole; isActive?: boolean };

export function canCreateRole(actorIsPlatformOwner: boolean, role: AppRole): boolean {
  return role !== "ADMIN" || actorIsPlatformOwner;
}

export function canPatchUserAuthority(actorIsPlatformOwner: boolean, target: AuthorityUser, patch: AuthorityPatch): boolean {
  if (target.isPlatformOwner) return actorIsPlatformOwner && patch.appRole === undefined && patch.isActive === undefined;
  const grantingAdmin = target.appRole !== "ADMIN" && patch.appRole === "ADMIN";
  const removingAdmin = target.appRole === "ADMIN" && target.isActive && (
    (patch.appRole !== undefined && patch.appRole !== "ADMIN") || patch.isActive === false
  );
  return actorIsPlatformOwner || (!grantingAdmin && !removingAdmin);
}

export function canResetUserPassword(actorIsPlatformOwner: boolean, target: Pick<AuthorityUser, "appRole" | "isPlatformOwner">): boolean {
  if (target.isPlatformOwner) return false;
  return target.appRole !== "ADMIN" || actorIsPlatformOwner;
}
