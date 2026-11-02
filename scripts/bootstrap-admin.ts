import { loadEnvConfig } from "@next/env";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { eq } from "drizzle-orm";

async function questionHidden(label: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal to enter the password safely.");
  }

  stdout.write(label);
  stdin.setEncoding("utf8");
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Password entry cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = Array.from(value).slice(0, -1).join("");
          continue;
        }
        if (character >= " ") value += character;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add the Neon connection string to .env.local first.");
  }

  const [{ db }, schema] = await Promise.all([import("../src/db"), import("../src/db/schema")]);

  // Chế độ không tương tác (CI/deploy): đọc từ biến môi trường, không ghi mật khẩu ra log.
  const envMode = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  let name: string;
  let email: string;
  let password: string;

  if (envMode) {
    name = (process.env.ADMIN_NAME || "Quản trị viên").trim();
    email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    password = process.env.ADMIN_PASSWORD || "";
  } else {
    const prompt = createInterface({ input: stdin, output: stdout });
    name = (await prompt.question("Tên quản trị viên: ")).trim();
    email = (await prompt.question("Email đăng nhập: ")).trim().toLowerCase();
    prompt.close();
    password = await questionHidden("Mật khẩu (tối thiểu 10 ký tự, không hiển thị): ");
  }

  try {
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
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Không thể tạo tài khoản Admin.");
  process.exitCode = 1;
});
