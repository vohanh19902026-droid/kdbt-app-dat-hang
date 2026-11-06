"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserOption = { id: string; name: string; email: string; emailVerified: boolean; isActive: boolean };
type RosterRow = { id: string; segment: "DA" | "DC"; displayName: string; observedMonths: number; reviewStatus: string; mappedUserId: string | null; mappedUserName: string | null; mappedUserEmail: string | null; evidenceCount: number };
type RosterResponse = { roster: RosterRow[]; salesUsers: UserOption[] };
const statuses = [
  ["NEEDS_EMPLOYER_CONFIRMATION", "Chờ xác nhận"],
  ["CONFIRMED_CURRENT", "Đang làm · đã ghép tài khoản"],
  ["NOT_CURRENT", "Không còn hiện hành"],
  ["DUPLICATE", "Tên trùng · rà soát"],
] as const;

export function LegacyRosterManager() {
  const [data, setData] = useState<RosterResponse>({ roster: [], salesUsers: [] });
  const [values, setValues] = useState<Record<string, { status: string; userId: string }>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const router = useRouter();

  async function load() {
    const response = await fetch("/api/admin/legacy-roster", { cache: "no-store" });
    const body = await response.json().catch(() => ({})) as RosterResponse & { error?: string };
    if (!response.ok) throw new Error(body.error || "Không tải được roster NVKD.");
    setData(body);
    setValues(Object.fromEntries(body.roster.map((row) => [row.id, { status: row.reviewStatus, userId: row.mappedUserId ?? "" }])));
  }

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(async () => {
      const response = await fetch("/api/admin/legacy-roster", { cache: "no-store" });
      const body = await response.json().catch(() => ({})) as RosterResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Không tải được roster NVKD.");
      if (!current) return;
      setData(body);
      setValues(Object.fromEntries(body.roster.map((row) => [row.id, { status: row.reviewStatus, userId: row.mappedUserId ?? "" }])));
    }).catch((caught: unknown) => { if (current) setError(caught instanceof Error ? caught.message : "Không tải được roster."); });
    return () => { current = false; };
  }, []);

  async function save(row: RosterRow) {
    const current = values[row.id];
    if (!current) return;
    setBusy(row.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/legacy-roster", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rosterId: row.id, reviewStatus: current.status, userId: current.status === "CONFIRMED_CURRENT" ? current.userId || null : null }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Không lưu được đối chiếu.");
      setNotice(`Đã lưu đối chiếu roster: ${row.displayName}.`);
      await load();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được đối chiếu.");
    } finally { setBusy(""); }
  }

  return <>
    <div className="pagehead"><div><div className="eyebrow">ROSTER KDBT · PKDBT- DA / PKDBT DC</div><h1>Đối chiếu NVKD</h1><div className="sub">Ghép theo xác nhận của quản lý và email Google đã xác minh. Không tự ghép theo tên gần giống.</div></div></div>
    <div className="notice">Roster lấy từ ô tên tô vàng trong hai sheet KDBT. Các nhân viên phải tự đăng nhập Google, gửi hồ sơ và được kích hoạt trước khi ghép. Chỉ roster đã xác nhận mới mở quyền tra cứu công nợ lịch sử cho NVKD.</div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="notice" role="status">{notice}</div>}
    <div className="tablewrap"><table className="grid"><thead><tr><th>TÊN NVKD</th><th>PHÂN HỆ</th><th>KỲ XUẤT HIỆN</th><th>CHỨNG CỨ Ô NGUỒN</th><th>TRẠNG THÁI ĐỐI CHIẾU</th><th>TÀI KHOẢN ĐÃ XÁC MINH</th><th></th></tr></thead><tbody>
      {data.roster.map((row) => {
        const current = values[row.id] ?? { status: row.reviewStatus, userId: row.mappedUserId ?? "" };
        return <tr key={row.id}>
          <td><b>{row.displayName}</b>{row.mappedUserEmail && <small>{row.mappedUserEmail}</small>}</td>
          <td>{row.segment === "DA" ? "Dự án" : "Dân cư"}</td>
          <td>{row.observedMonths}/9 tháng</td>
          <td>{row.evidenceCount} ô vàng</td>
          <td><select className="pill" value={current.status} onChange={(event) => setValues((all) => ({ ...all, [row.id]: { ...current, status: event.target.value } }))}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
          <td><select className="pill" disabled={current.status !== "CONFIRMED_CURRENT"} value={current.userId} onChange={(event) => setValues((all) => ({ ...all, [row.id]: { ...current, userId: event.target.value } }))}><option value="">Chọn email đã xác minh</option>{data.salesUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></td>
          <td><button className="btn secondary" disabled={busy === row.id} onClick={() => void save(row)}>{busy === row.id ? "Đang lưu…" : "Lưu"}</button></td>
        </tr>;
      })}
    </tbody></table>{data.roster.length === 0 && <div className="empty">Roster chưa được nạp vào Preview database.</div>}</div>
  </>;
}
