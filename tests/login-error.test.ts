import assert from "node:assert/strict";
import { test } from "node:test";
import { loginErrorMessage } from "../src/lib/login-error";

test("login distinguishes wrong credentials from server, network and rate-limit failures", () => {
  assert.match(loginErrorMessage(401), /mật khẩu chưa đúng/);
  assert.match(loginErrorMessage(403), /chưa được phép/);
  assert.match(loginErrorMessage(429), /quá nhiều lần/);
  assert.doesNotMatch(loginErrorMessage(500), /mật khẩu chưa đúng/);
  assert.match(loginErrorMessage(), /kết nối/);
});
