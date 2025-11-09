// client/src/pages/StaffDashboard.jsx - Dashboard cho nhân viên
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStaffTasks } from "../api/requestApi";
import { fmtDateTime24 } from "../utils/datetime";
import { fmtAddress } from "../utils/address";
import "../styles/movingService.css";

const STATUS_CONFIG = {
  UNDER_SURVEY: {
    label: "Đang khảo sát",
    color: "#2196f3",
    bg: "#e3f2fd",
    description: "Cần khảo sát nhà và nhập đồ dùng",
  },
  WAITING_PAYMENT: {
    label: "Chờ thanh toán",
    color: "#9c27b0",
    bg: "#f3e5f5",
    description: "Đã báo giá, chờ khách thanh toán",
  },
  IN_PROGRESS: {
    label: "Đang vận chuyển",
    color: "#00bcd4",
    bg: "#e0f7fa",
    description: "Đang thực hiện vận chuyển",
  },
  DONE: {
    label: "Đã hoàn thành",
    color: "#4caf50",
    bg: "#e8f5e9",
    description: "Đã hoàn thành dịch vụ",
  },
};

const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || {
    label: status || "Không xác định",
    color: "#757575",
    bg: "#fafafa",
    description: "",
  };
};

export default function StaffDashboard() {
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState(""); // Lọc theo trạng thái
  const [searchPhone, setSearchPhone] = useState(""); // Tìm kiếm theo SĐT

  // Load tất cả requests cho staff
  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getStaffTasks();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading staff tasks:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filter requests
  const filteredRequests = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  // Sắp xếp: mới nhất trước
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.requestDate || 0);
    const dateB = new Date(b.createdAt || b.requestDate || 0);
    return dateB - dateA;
  });

  // Thống kê
  const stats = {
    survey: requests.filter((r) => r.status === "UNDER_SURVEY").length,
    waiting: requests.filter((r) => r.status === "WAITING_PAYMENT").length,
    inProgress: requests.filter((r) => r.status === "IN_PROGRESS").length,
    done: requests.filter((r) => r.status === "DONE").length,
  };

  return (
    <div className="moving-service-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1>Staff Dashboard - Quản Lý Công Việc</h1>
          <p>Xem và quản lý các công việc được phân công</p>
        </div>

        {/* Stats Cards */}
        <div className="main-card">
          <h2 style={{ marginTop: 0, marginBottom: "1rem", color: "#2c3e50" }}>Thống kê công việc</h2>
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #2196f3 0%, #2196f3dd 100%)" }}>
              <h3 style={{ color: "white", margin: 0 }}>{stats.survey}</h3>
              <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Cần khảo sát</p>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #9c27b0 0%, #9c27b0dd 100%)" }}>
              <h3 style={{ color: "white", margin: 0 }}>{stats.waiting}</h3>
              <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Chờ thanh toán</p>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #00bcd4 0%, #00bcd4dd 100%)" }}>
              <h3 style={{ color: "white", margin: 0 }}>{stats.inProgress}</h3>
              <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Đang vận chuyển</p>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #4caf50 0%, #4caf50dd 100%)" }}>
              <h3 style={{ color: "white", margin: 0 }}>{stats.done}</h3>
              <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Đã hoàn thành</p>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="main-card">
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
              <input
                placeholder="Tìm kiếm theo số điện thoại..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="form-group input-primary"
                style={{ flex: 1, minWidth: "250px", maxWidth: "400px" }}
              />
              <button onClick={loadRequests} className="btn btn-primary">
                Làm mới
              </button>
            </div>

            {/* Filter buttons */}
            {requests.length > 0 && (
              <div className="filter-buttons">
                <button
                  onClick={() => setFilterStatus("")}
                  className={`filter-btn ${filterStatus === "" ? "active" : ""}`}
                >
                  Tất cả ({requests.length})
                </button>
                {Object.keys(STATUS_CONFIG).map((key) => {
                  const count = requests.filter((r) => r.status === key).length;
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
          ) : sortedRequests.length === 0 ? (
            <div className="empty-state">
              <h3>Chưa có công việc nào</h3>
              <p>
                {requests.length === 0
                  ? "Bạn chưa được phân công công việc nào. Vui lòng liên hệ manager."
                  : `Không có công việc nào với trạng thái "${filterStatus ? getStatusConfig(filterStatus).label : ""}"`}
              </p>
            </div>
          ) : (
            <div className="moves-list">
              {sortedRequests
                .filter((r) => !searchPhone || r.customerPhone?.includes(searchPhone))
                .map((r) => {
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
                          <strong>Khách hàng:</strong> {r.customerName}
                        </p>
                        <p>
                          <strong>SĐT:</strong> {r.customerPhone}
                        </p>
                        <p>
                          <strong>Lấy hàng:</strong> {fmtAddress(r.pickupAddress || r.address)}
                        </p>
                        <p>
                          <strong>Giao hàng:</strong> {fmtAddress(r.deliveryAddress || r.address)}
                        </p>
                        <p>
                          <strong>Thời gian chuyển:</strong> {fmtDateTime24(r.movingTime)}
                        </p>
                        {r.surveyFee && (
                          <p>
                            <strong>Phí khảo sát:</strong> {r.surveyFee.toLocaleString()}₫
                          </p>
                        )}
                      </div>
                      <div className="move-actions">
                        {r.status === "UNDER_SURVEY" && (
                          <button
                            onClick={() => nav(`/staff/survey/${r._id}`)}
                            className="btn btn-primary"
                          >
                            Khảo sát & Nhập đồ dùng
                          </button>
                        )}
                        {r.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => nav(`/staff/task/${r._id}`)}
                            className="btn btn-primary"
                          >
                            Xem chi tiết & Cập nhật
                          </button>
                        )}
                        <button
                          onClick={() => nav(`/requests/${r._id}/detail`)}
                          className="btn btn-secondary"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

