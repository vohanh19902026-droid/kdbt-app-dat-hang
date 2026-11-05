import assert from "node:assert/strict";
import test from "node:test";
import { canCreateRole, canPatchUserAuthority, canResetUserPassword } from "../src/lib/platform-owner-policy";

test("only platform owner can create or grant ADMIN", () => {
  assert.equal(canCreateRole(false, "SALES"), true);
  assert.equal(canCreateRole(false, "ADMIN"), false);
  assert.equal(canCreateRole(true, "ADMIN"), true);
  assert.equal(canPatchUserAuthority(false, { appRole: "SALES", isActive: false, isPlatformOwner: false }, { appRole: "ADMIN" }), false);
  assert.equal(canPatchUserAuthority(true, { appRole: "SALES", isActive: false, isPlatformOwner: false }, { appRole: "ADMIN", isActive: true }), true);
});

test("ordinary admins cannot demote or deactivate another admin", () => {
  const admin = { appRole: "ADMIN" as const, isActive: true, isPlatformOwner: false };
  assert.equal(canPatchUserAuthority(false, admin, { appRole: "SALES" }), false);
  assert.equal(canPatchUserAuthority(false, admin, { isActive: false }), false);
  assert.equal(canPatchUserAuthority(true, admin, { isActive: false }), true);
});

test("platform owner authority cannot be changed through account APIs", () => {
  const owner = { appRole: "ADMIN" as const, isActive: true, isPlatformOwner: true };
  assert.equal(canPatchUserAuthority(false, owner, {}), false);
  assert.equal(canPatchUserAuthority(true, owner, {}), true);
  assert.equal(canPatchUserAuthority(true, owner, { appRole: "SALES" }), false);
  assert.equal(canPatchUserAuthority(true, owner, { isActive: false }), false);
  assert.equal(canResetUserPassword(true, owner), false);
  assert.equal(canResetUserPassword(false, { appRole: "ADMIN", isPlatformOwner: false }), false);
  assert.equal(canResetUserPassword(true, { appRole: "ADMIN", isPlatformOwner: false }), true);
});
