import { loadEnvConfig } from "@next/env";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function questionHidden(label: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Chạy lệnh trong PowerShell tương tác để nhập mật khẩu an toàn.");
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
          reject(new Error("Đã hủy thao tác."));
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

function describeTarget(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return "(DATABASE_URL không hợp lệ)";
  }
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Thiếu DATABASE_URL. Dùng `vercel env run --environment production -- npm run auth:reset-admin-password`.");
  }

  const prompt = createInterface({ input: stdin, output: stdout });
  const email = (await prompt.question("Email Admin cần khôi phục: ")).trim().toLowerCase();
  stdout.write(`[auth] Đích cơ sở dữ liệu: ${describeTarget(connectionString)}\n`);
  const confirmation = await prompt.question(`Gõ RESET ${email} để xác nhận: `);
  prompt.close();

  if (!email || confirmation.trim() !== `RESET ${email}`) {
    throw new Error("Email xác nhận không khớp; chưa thay đổi dữ liệu.");
  }

  const password = await questionHidden("Mật khẩu mới (ít nhất 10 ký tự): ");
  const confirmationPassword = await questionHidden("Nhập lại mật khẩu mới: ");
  if (password.length < 10 || password.length > 128) {
    throw new Error("Mật khẩu phải có từ 10 đến 128 ký tự.");
  }
  if (password !== confirmationPassword) {
    throw new Error("Hai lần nhập mật khẩu không khớp.");
  }

  const [{ db }, schema] = await Promise.all([import("../src/db"), import("../src/db/schema")]);
  try {
    const [target] = await db.select({ id: schema.user.id })
      .from(schema.user)
      .where(and(eq(schema.user.email, email), eq(schema.user.appRole, "ADMIN"), eq(schema.user.isActive, true)))
      .limit(1);
    if (!target) throw new Error("Không tìm thấy tài khoản Admin đang hoạt động với email này.");

    const [credential] = await db.select({ id: schema.account.id })
      .from(schema.account)
      .where(and(eq(schema.account.userId, target.id), eq(schema.account.providerId, "credential")))
      .limit(1);
    if (!credential) throw new Error("Tài khoản Admin không có thông tin đăng nhập bằng mật khẩu.");

    const passwordHash = await hashPassword(password);
    await db.transaction(async (tx) => {
      const [updatedCredential] = await tx.update(schema.account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(schema.account.id, credential.id))
        .returning({ id: schema.account.id });
      if (!updatedCredential) throw new Error("Thông tin đăng nhập đã thay đổi; chưa thu hồi phiên nào.");
      await tx.delete(schema.session).where(eq(schema.session.userId, target.id));
    });

    console.log(`[auth] Đã cập nhật mật khẩu cho ${email}; toàn bộ phiên đăng nhập cũ đã bị thu hồi.`);
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Không thể khôi phục mật khẩu Admin.");
  process.exitCode = 1;
});
