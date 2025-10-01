import { useEffect, useState } from "react";
import { listRequestsByPhone, cancelRequest } from "../api/requestApi";
import { useNavigate } from "react-router-dom";
import { normalizeVNPhone } from "../utils/validation";
import { fmtDateTime24 } from "../utils/datetime";

const VN_STATUS = {
  PENDING_REVIEW: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export default function ManageRequestsPage() {
  const nav = useNavigate();
  const [phone, setPhone] = useState(localStorage.getItem("my_phone") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const p = normalizeVNPhone(phone || "");
    if (!p) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await listRequestsByPhone(p);
      setRows(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* auto load theo localStorage */ }, []);
  useEffect(() => { localStorage.setItem("my_phone", phone); }, [phone]);

  const onCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy request này không?")) return;
    await cancelRequest(id);
    load();
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Quản lý Request của tôi</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
        <input
          placeholder="Nhập số điện thoại đã dùng để tạo request"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, width: 360 }}
        />
        <button onClick={load} style={btn}>Tải</button>
        <button onClick={() => nav("/requests/new")} style={btnHollow}>Tạo mới</button>
      </div>

      {loading ? "Đang tải..." : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Tên</th>
              <th style={th}>SĐT</th>
              <th style={th}>Địa chỉ</th>
              <th style={th}>Thời gian</th>
              <th style={th}>Dịch vụ</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td style={td}>{r.customerName}</td>
                <td style={td}>{r.customerPhone}</td>
                <td style={td}>{r.address}</td>
                <td style={td}>{fmtDateTime24(r.movingTime)}</td>
                <td style={td}>{r.serviceType === "EXPRESS" ? "Hỏa tốc" : "Thường"}</td>
                <td style={td}>{VN_STATUS[r.status] || r.status}</td>
                <td style={td}>
                  <button
                    disabled={r.status !== "PENDING_REVIEW"}
                    onClick={() => nav(`/requests/${r._id}/edit`)}
                    style={btnSmall}
                  >Sửa</button>{" "}
                  <button
                    disabled={!["PENDING_REVIEW","APPROVED"].includes(r.status)}
                    onClick={() => onCancel(r._id)}
                    style={{ ...btnSmall, color: "#c00", borderColor: "#c00" }}
                  >Hủy</button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} style={{ padding: 16, textAlign: "center", color: "#777" }}>
                Chưa có request nào. Hãy tạo mới.
              </td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = { textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" };
const td = { padding: 8, borderBottom: "1px solid #eee" };
const btn = { padding: "8px 12px", border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 8 };
const btnHollow = { padding: "8px 12px", border: "1px solid #111", background: "#fff", color: "#111", borderRadius: 8 };
const btnSmall = { padding: "4px 8px", border: "1px solid #111", background: "#fff", borderRadius: 6 };
