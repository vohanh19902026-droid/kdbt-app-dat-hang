/** Translate authentication failures without exposing server details. */
export function loginErrorMessage(status?: number): string {
  if (status === 401) return "Tài khoản hoặc mật khẩu chưa đúng. Vui lòng thử lại.";
  if (status === 403) return "Tài khoản chưa được phép đăng nhập. Vui lòng liên hệ quản trị viên.";
  if (status === 429) return "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.";
  return "Không thể đăng nhập lúc này. Vui lòng kiểm tra kết nối và thử lại, hoặc liên hệ quản trị viên nếu lỗi tiếp tục.";
}
