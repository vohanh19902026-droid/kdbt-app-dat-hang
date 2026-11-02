"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Giữ log phía client ngắn gọn; server đã ghi stack đầy đủ theo digest.
    console.error("workspace_render_failed", { digest: error.digest });
  }, [error]);

  return (
    <div className="pagehead" style={{ display: "block" }}>
      <div className="eyebrow">CÓ LỖI KHI TẢI TRANG</div>
      <h1>Chưa hiển thị được nội dung</h1>
      <div className="sub">
        Dữ liệu của bạn vẫn an toàn. Hãy thử tải lại; nếu vẫn lỗi, gửi mã tra cứu bên dưới cho bộ phận kỹ thuật.
      </div>
      {error.digest && (
        <p style={{ marginTop: 12, fontSize: 13, color: "#5d6b60" }}>
          Mã tra cứu: <code>{error.digest}</code>
        </p>
      )}
      <div className="heading-actions" style={{ marginTop: 18 }}>
        <button className="btn" onClick={() => reset()}>
          <RotateCcw size={16} /> Thử lại
        </button>
        <a className="btn secondary" href="/orders">
          Về trang đơn hàng
        </a>
      </div>
    </div>
  );
}
