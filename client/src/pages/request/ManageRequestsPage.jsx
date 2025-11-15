import { useEffect, useState } from "react";
import { getMyRequests, cancelRequest } from "../../api/requestApi";
import { createVNPayPayment } from "../../api/paymentApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fmtDateTime24 } from "../../utils/datetime";
import { fmtAddress } from "../../utils/address";
import "../../styles/movingService.css";

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
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState(""); // Lọc theo trạng thái

  const load = async () => {
    if (!user) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const response = await getMyRequests();
      // getMyRequests returns { requests: [...] }
      const requests = response.requests || response.data?.requests || [];
      setRows(Array.isArray(requests) ? requests : []);
    } catch (err) {
      console.error("Error loading requests:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]); // Reload when user changes

  const onCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy request này không?")) return;
    await cancelRequest(id);
    load();
  };

  const handlePayment = async (request) => {
    try {
      if (!window.confirm(`Bạn có chắc chắn muốn thanh toán cho request ${request.requestId || request._id}?`)) {
        return;
      }
      
      setLoading(true);
      console.log('🔄 [Payment] Creating VNPay payment for request:', request._id);
      
      const response = await createVNPayPayment(request._id);
      
      console.log('✅ [Payment] Payment URL received:', response);
      
      if (response.paymentUrl) {
        // Redirect to VNPay payment page
        console.log('🔄 [Payment] Redirecting to VNPay...');
        window.location.href = response.paymentUrl;
      } else {
        console.error('❌ [Payment] No paymentUrl in response:', response);
        alert("❌ Không thể tạo link thanh toán. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("❌ [Payment] Payment error:", err);
      const errorMessage = err.message || "Vui lòng thử lại";
      alert("❌ Lỗi khi tạo thanh toán:\n" + errorMessage);
    } finally {
      setLoading(false);
    }
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
    <div className="moving-service-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1>My Moves - Quản Lý Yêu Cầu</h1>
          <p>Xem và quản lý tất cả các yêu cầu vận chuyển của bạn</p>
        </div>

        <div className="main-card">
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button onClick={load} className="btn btn-primary" disabled={loading}>
                  {loading ? "Đang tải..." : "Làm mới"}
                </button>
                <button onClick={() => nav("/requests/new")} className="btn btn-secondary">
                  Tạo mới
                </button>
              </div>
              {user && (
                <div style={{ fontSize: "0.9em", color: "#666" }}>
                  Hiển thị yêu cầu của: <strong>{user.name || user.email}</strong>
                </div>
              )}
            </div>

            {/* Bộ lọc trạng thái */}
            {rows.length > 0 && (
              <div className="filter-buttons">
                <button
                  onClick={() => setFilterStatus("")}
                  className={`filter-btn ${filterStatus === "" ? "active" : ""}`}
                >
                  Tất cả ({rows.length})
                </button>
                {Object.keys(STATUS_CONFIG)
                  .filter((k) => !["PENDING_REVIEW", "APPROVED"].includes(k))
                  .map((key) => {
                    const count = rows.filter((r) => r.status === key).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
                        className={`filter-btn ${filterStatus === key ? "active" : ""}`}
                        style={{
                          borderColor: STATUS_CONFIG[key].color,
                        }}
                      >
                        {STATUS_CONFIG[key].label} ({count})
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Đang tải...</p>
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="empty-state">
              <h3>
                {rows.length === 0
                  ? "Chưa có request nào"
                  : `Không có request nào với trạng thái "${filterStatus ? getStatusConfig(filterStatus).label : ""}"`}
              </h3>
              <p>
                {rows.length === 0
                  ? "Hãy tạo yêu cầu vận chuyển mới để bắt đầu"
                  : "Thử chọn trạng thái khác hoặc tạo request mới"}
              </p>
              {rows.length === 0 && (
                <button className="btn btn-primary" onClick={() => nav("/requests/new")}>
                  Tạo Yêu Cầu Mới
                </button>
              )}
            </div>
          ) : (
            <div className="moves-list">
              {sortedRows.map((r) => {
                const statusConfig = getStatusConfig(r.status);
                const shortId = r._id?.slice(-8) || "N/A";
                const statusKey = r.status?.toLowerCase().replace("_", "-") || "unknown";
                return (
                  <div key={r._id} className="move-card">
                    <div className="move-header">
                      <h3>Request #{shortId}</h3>
                      <span
                        className={`status-badge ${statusKey}`}
                        style={{
                          backgroundColor: statusConfig.bg,
                          color: statusConfig.color,
                        }}
                        title={statusConfig.description}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="move-details">
                      <p>
                        <strong>Tên khách hàng:</strong> {r.customerName || "N/A"}
                      </p>
                      <p>
                        <strong>Số điện thoại:</strong> {r.customerPhone || r.moveDetails?.phone || "N/A"}
                      </p>
                      <p>
                        <strong>Lấy hàng:</strong> {
                          r.pickupAddress 
                            ? fmtAddress(r.pickupAddress) 
                            : r.moveDetails?.fromAddress 
                            ? r.moveDetails.fromAddress 
                            : fmtAddress(r.address) || "N/A"
                        }
                      </p>
                      <p>
                        <strong>Giao hàng:</strong> {
                          r.deliveryAddress 
                            ? fmtAddress(r.deliveryAddress) 
                            : r.moveDetails?.toAddress 
                            ? r.moveDetails.toAddress 
                            : fmtAddress(r.address) || "N/A"
                        }
                      </p>
                      <p>
                        <strong>Thời gian chuyển:</strong> {fmtDateTime24(r.movingTime || r.moveDetails?.moveDate) || "N/A"}
                      </p>
                      <p>
                        <strong>Tạo lúc:</strong> {new Date(r.createdAt || r.requestDate).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="move-actions">
                      <button
                        onClick={() => nav(`/requests/${r._id}/detail`)}
                        className="btn btn-primary"
                      >
                        Chi tiết
                      </button>
                      {(r.status === "PENDING_CONFIRMATION" || r.status === "PENDING_REVIEW") && (
                        <button
                          onClick={() => nav(`/requests/${r._id}/edit`)}
                          className="btn btn-secondary"
                        >
                          Sửa
                        </button>
                      )}
                      {["PENDING_CONFIRMATION", "UNDER_SURVEY", "WAITING_PAYMENT", "PENDING_REVIEW"].includes(
                        r.status
                      ) && (
                        <button onClick={() => onCancel(r._id)} className="btn btn-danger">
                          Hủy
                        </button>
                      )}
                      {r.status === "WAITING_PAYMENT" && (
                        <button
                          onClick={() => nav(`/quote/summary`, { state: { requestId: r._id } })}
                          className="btn btn-success"
                        >
                          Xem báo giá
                        </button>
                      )}
                      {/* Payment button for online banking requests */}
                      {(r.status === "WAITING_PAYMENT" || r.status === "UNDER_SURVEY" || r.status === "PENDING") && 
                       r.paymentMethod === "online_banking" && 
                       r.paymentStatus !== "deposit_paid" && 
                       r.paymentStatus !== "fully_paid" && (
                        <button
                          onClick={() => handlePayment(r)}
                          className="btn btn-success"
                          disabled={loading}
                          style={{ 
                            background: "#4caf50",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            cursor: loading ? "not-allowed" : "pointer"
                          }}
                        >
                          💳 Thanh toán VNPay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Thống kê */}
        {rows.length > 0 && (
          <div className="main-card">
            <h2 style={{ marginTop: 0, marginBottom: "1rem", color: "#2c3e50" }}>Thống kê</h2>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              {Object.keys(STATUS_CONFIG)
                .filter((k) => !["PENDING_REVIEW", "APPROVED"].includes(k))
                .map((key) => {
                  const count = rows.filter((r) => r.status === key).length;
                  if (count === 0) return null;
                  return (
                    <div
                      key={key}
                      className="stat-card"
                      style={{
                        background: `linear-gradient(135deg, ${STATUS_CONFIG[key].color} 0%, ${STATUS_CONFIG[key].color}dd 100%)`,
                      }}
                    >
                      <h3 style={{ color: "white", margin: 0 }}>{count}</h3>
                      <p style={{ color: "white", opacity: 0.9, margin: 0 }}>{STATUS_CONFIG[key].label}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

