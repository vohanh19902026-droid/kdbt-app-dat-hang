import { loadEnvConfig } from "@next/env";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { eq } from "drizzle-orm";

loadEnvConfig(process.cwd());
const [{ db }, schema] = await Promise.all([import("../src/db"), import("../src/db/schema")]);
const prompt = createInterface({ input: stdin, output: stdout });
try {
  const name = (await prompt.question("Tên quản trị viên: ")).trim();
  const email = (await prompt.question("Email đăng nhập: ")).trim().toLowerCase();
  const password = await prompt.question("Mật khẩu (tối thiểu 10 ký tự): ");
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
    throw new Error("Tên, email hoặc mật khẩu không hợp lệ.");
  }
  const [existing] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email)).limit(1);
  if (existing) throw new Error("Email này đã có tài khoản.");
  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.insert(schema.user).values({ id, name, email, emailVerified: true, role: "admin", appRole: "ADMIN", isActive: true });
    await tx.insert(schema.account).values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: passwordHash });
  });
  console.log(`Đã tạo Admin ${email}. Đăng nhập để cấp tài khoản nhân viên.`);
} finally {
  prompt.close();
  await db.$client.end();
}