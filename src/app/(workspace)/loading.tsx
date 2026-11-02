export default function WorkspaceLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="pagehead" style={{ display: "block" }}>
        <div className="eyebrow">ĐANG TẢI DỮ LIỆU</div>
        <h1>Vui lòng chờ trong giây lát</h1>
        <div className="sub">Hệ thống đang lấy dữ liệu mới nhất từ máy chủ.</div>
      </div>
      <div className="stats" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div className="stat" key={item}>
            <div style={{ height: 12, width: "55%", background: "#e7ece8", borderRadius: 6 }} />
            <div style={{ height: 26, width: "70%", background: "#eef2ee", borderRadius: 6, marginTop: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
