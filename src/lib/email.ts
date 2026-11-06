import nodemailer from "nodemailer";

const DEFAULT_SMTP_HOST = "smtp.gmail.com";

function getMailConfig() {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) {
    throw new Error("Email service is not configured.");
  }

  const port = Number(process.env.SMTP_PORT || 465);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Email service configuration is invalid.");
  }

  return {
    user,
    password,
    host: process.env.SMTP_HOST?.trim() || DEFAULT_SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    from: process.env.MAIL_FROM?.trim() || user,
  };
}

export async function sendPasswordResetEmail({ to, url }: { to: string; url: string }) {
  const config = getMailConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject: "Đặt lại mật khẩu CENCOM",
      text: [
        "Chúng tôi nhận được yêu cầu đặt lại mật khẩu CENCOM cho địa chỉ email này.",
        "Mở liên kết sau trong vòng 30 phút để xác minh email và tạo mật khẩu mới:",
        url,
        "Nếu bạn không yêu cầu đặt lại, hãy bỏ qua email này. Mật khẩu hiện tại vẫn giữ nguyên.",
      ].join("\n\n"),
      html: `<!doctype html><html lang="vi"><body style="margin:0;background:#f3f6f2;color:#20342b;font:16px/1.6 Arial,sans-serif;padding:28px"><main style="max-width:560px;margin:auto;background:white;border:1px solid #dce7df;border-radius:14px;padding:28px"><p style="color:#538365;font-size:12px;font-weight:bold;letter-spacing:2px">CENCOM</p><h1 style="font-size:24px">Đặt lại mật khẩu</h1><p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CENCOM gắn với địa chỉ email này.</p><p>Chọn nút bên dưới để xác minh email và tạo mật khẩu mới. Liên kết có hiệu lực trong <b>30 phút</b>.</p><p style="margin:26px 0"><a href="${url}" style="display:inline-block;background:#174b3b;color:white;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:8px">Xác minh email và đặt lại mật khẩu</a></p><p style="font-size:13px;color:#61736a">Nếu nút không mở được, sao chép liên kết này vào trình duyệt:<br><a href="${url}" style="overflow-wrap:anywhere">${url}</a></p><p style="font-size:13px;color:#61736a">Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu hiện tại vẫn giữ nguyên.</p></main></body></html>`,
    });
  } catch {
    // Never forward SMTP errors: providers may include account or transport details.
    throw new Error("Password reset email could not be sent.");
  } finally {
    transporter.close();
  }
}
