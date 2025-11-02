import { useEffect, useState } from "react";
import { listRequestsByPhone, cancelRequest } from "../api/requestApi";
import { useNavigate } from "react-router-dom";
import { normalizeVNPhone } from "../utils/validation";
import { fmtDateTime24 } from "../utils/datetime";
import { fmtAddress } from "../utils/address";

// Trạng thái đầy đủ với màu sắc và mô tả
const STATUS_CONFIG = {
  PENDING_CONFIRMATION: {
    label: "Đang chờ xác nhận",
    color: "#ff9800",
    bg: "#fff3e0",
    description: "Yêu cầu mới, đang chờ nhân viên xác nhận",
  },
  UNDER_SURVEY: {
    label: "Đang khảo sát",
    color: "#2196f3",
    bg: "#e3f2fd",
    description: "Nhân viên đang khảo sát nhà",
  },
  WAITING_PAYMENT: {
    label: "Chờ thanh toán",
    color: "#9c27b0",
    bg: "#f3e5f5",
    description: "Đã báo giá, chờ thanh toán",
  },
  IN_PROGRESS: {
    label: "Đang vận chuyển",
    color: "#00bcd4",
    bg: "#e0f7fa",
    description: "Đã thanh toán, đang trong quá trình vận chuyển",
  },
  DONE: {
    label: "Đã hoàn thành",
    color: "#4caf50",
    bg: "#e8f5e9",
    description: "Đã hoàn thành dịch vụ",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "#f44336",
    bg: "#ffebee",
    description: "Yêu cầu đã bị hủy",
  },
  REJECTED: {
    label: "Bị từ chối",
    color: "#757575",
    bg: "#fafafa",
    description: "Yêu cầu bị từ chối",
  },
  // Backward compat
  PENDING_REVIEW: {
    label: "Đang chờ xác nhận",
    color: "#ff9800",
    bg: "#fff3e0",
    description: "Yêu cầu mới, đang chờ nhân viên xác nhận",
  },
  APPROVED: {
    label: "Chờ thanh toán",
    color: "#9c27b0",
    bg: "#f3e5f5",
    description: "Đã duyệt, chờ thanh toán",
  },
};

// Hàm lấy config status (fallback nếu không có)
const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || {
    label: status || "Không xác định",
    color: "#757575",
    bg: "#fafafa",
    description: "",
  };
};

export default function ManageRequestsPage() {
  const nav = useNavigate();
  const [phone, setPhone] = useState(localStorage.getItem("my_phone") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState(""); // Lọc theo trạng thái

  const load = async () => {
    const p = normalizeVNPhone(phone || "");
    if (!p) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await listRequestsByPhone(p);
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // auto load theo localStorage
  useEffect(() => {
    localStorage.setItem("my_phone", phone);
  }, [phone]);

  const onCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy request này không?")) return;
    await cancelRequest(id);
    load();
  };

  // Lọc rows theo status
  const filteredRows = filterStatus
    ? rows.filter((r) => r.status === filterStatus)
    : rows;

  // Sắp xếp: mới nhất trước
  const sortedRows = [...filteredRows].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.requestDate || 0);
    const dateB = new Date(b.createdAt || b.requestDate || 0);
    return dateB - dateA;
  });

  return (
    <div style={{ padding: 24 }}>
      <h1>Quản lý Request của tôi</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0", flexWrap: "wrap" }}>
        <input
          placeholder="Nhập số điện thoại đã dùng để tạo request"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, width: 280 }}
        />
        <button onClick={load} style={btn}>
          Tải
        </button>
        <button onClick={() => nav("/requests/new")} style={btnHollow}>
          Tạo mới
        </button>
      </div>

      {/* Bộ lọc trạng thái */}
      {rows.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <strong>Lọc theo trạng thái:</strong>
          <button
            onClick={() => setFilterStatus("")}
            style={{
              ...btnSmall,
              background: filterStatus === "" ? "#111" : "#fff",
              color: filterStatus === "" ? "#fff" : "#111",
            }}
          >
            Tất cả ({rows.length})
          </button>
          {Object.keys(STATUS_CONFIG).filter(k => !["PENDING_REVIEW", "APPROVED"].includes(k)).map((key) => {
            const count = rows.filter((r) => r.status === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
                style={{
                  ...btnSmall,
                  background: filterStatus === key ? STATUS_CONFIG[key].color : "#fff",
                  color: filterStatus === key ? "#fff" : STATUS_CONFIG[key].color,
                  borderColor: STATUS_CONFIG[key].color,
                }}
              >
                {STATUS_CONFIG[key].label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: "center" }}>Đang tải...</div>
      ) : sortedRows.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "#777" }}>
          {rows.length === 0
            ? "Chưa có request nào. Hãy tạo mới."
            : `Không có request nào với trạng thái "${filterStatus ? getStatusConfig(filterStatus).label : ""}"`}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={th}>Mã</th>
                <th style={th}>Tên</th>
                <th style={th}>SĐT</th>
                <th style={th}>Lấy hàng</th>
                <th style={th}>Giao hàng</th>
                <th style={th}>Thời gian</th>
                <th style={th}>Trạng thái</th>
                <th style={th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => {
                const statusConfig = getStatusConfig(r.status);
                const shortId = r._id?.slice(-8) || "N/A";
                return (
                  <tr key={r._id}>
                    <td style={td}>
                      <code style={{ fontSize: "0.85em", color: "#666" }}>#{shortId}</code>
                    </td>
                    <td style={td}>{r.customerName}</td>
                    <td style={td}>{r.customerPhone}</td>
                    <td style={td}>
                      <div style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {fmtAddress(r.pickupAddress || r.address)}
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {fmtAddress(r.deliveryAddress || r.address)}
                      </div>
                    </td>
                    <td style={td}>{fmtDateTime24(r.movingTime)}</td>
                    <td style={td}>
                      <div
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 12,
                          background: statusConfig.bg,
                          color: statusConfig.color,
                          fontWeight: 500,
                          fontSize: "0.9em",
                          border: `1px solid ${statusConfig.color}`,
                        }}
                        title={statusConfig.description}
                      >
                        {statusConfig.label}
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {/* Xem chi tiết - luôn hiển thị */}
                        <button
                          onClick={() => nav(`/requests/${r._id}/detail`)}
                          style={{ ...btnTiny, background: "#2196f3", color: "#fff", borderColor: "#2196f3" }}
                        >
                          Chi tiết
                        </button>

                        {/* Sửa - chỉ khi PENDING_CONFIRMATION */}
                        {(r.status === "PENDING_CONFIRMATION" || r.status === "PENDING_REVIEW") && (
                          <button
                            onClick={() => nav(`/requests/${r._id}/edit`)}
                            style={btnTiny}
                          >
                            Sửa
                          </button>
                        )}

                        {/* Hủy - chỉ khi chưa thanh toán hoặc chưa vận chuyển */}
                        {["PENDING_CONFIRMATION", "UNDER_SURVEY", "WAITING_PAYMENT", "PENDING_REVIEW"].includes(r.status) && (
                          <button
                            onClick={() => onCancel(r._id)}
                            style={{ ...btnTiny, color: "#f44336", borderColor: "#f44336" }}
                          >
                            Hủy
                          </button>
                        )}

                        {/* Xem báo giá - nếu có */}
                        {r.status === "WAITING_PAYMENT" && (
                          <button
                            onClick={() => nav(`/quote/summary`, { state: { requestId: r._id } })}
                            style={{ ...btnTiny, background: "#9c27b0", color: "#fff", borderColor: "#9c27b0" }}
                          >
                            Xem báo giá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Thống kê */}
      {rows.length > 0 && (
        <div style={{ marginTop: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Thống kê</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {Object.keys(STATUS_CONFIG)
              .filter((k) => !["PENDING_REVIEW", "APPROVED"].includes(k))
              .map((key) => {
                const count = rows.filter((r) => r.status === key).length;
                if (count === 0) return null;
                return (
                  <div key={key} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.5em", fontWeight: "bold", color: STATUS_CONFIG[key].color }}>
                      {count}
                    </div>
                    <div style={{ fontSize: "0.9em", color: "#666" }}>{STATUS_CONFIG[key].label}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: 12,
  borderBottom: "2px solid #ddd",
  background: "#f5f5f5",
  fontWeight: 600,
};
const td = {
  padding: 12,
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
};
const btn = {
  padding: "8px 16px",
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};
const btnHollow = {
  padding: "8px 16px",
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};
const btnSmall = {
  padding: "6px 12px",
  border: "1px solid #ccc",
  background: "#fff",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};
const btnTiny = {
  padding: "4px 8px",
  border: "1px solid #111",
  background: "#fff",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
};
