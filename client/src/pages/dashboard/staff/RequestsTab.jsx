import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmtDateTime24 } from '../../../utils/datetime';
import { fmtAddress } from '../../../utils/address';
import Card, { CardHeader, CardBody, CardActions } from '../../../components/shared/Card';
import StatusBadge from '../../../components/shared/StatusBadge';
import Button from '../../../components/shared/Button';

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

export default function RequestsTab({ requests, loading, onRefresh }) {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const filteredRequests = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.requestDate || 0);
    const dateB = new Date(b.createdAt || b.requestDate || 0);
    return dateB - dateA;
  });

  const requestStats = {
    survey: requests.filter((r) => r.status === "UNDER_SURVEY").length,
    waiting: requests.filter((r) => r.status === "WAITING_PAYMENT").length,
    inProgress: requests.filter((r) => r.status === "IN_PROGRESS").length,
    done: requests.filter((r) => r.status === "DONE").length,
  };

  return (
    <div className="dashboard-section">
      <h2>Staff Dashboard - Quản Lý Công Việc</h2>
      <p>Xem và quản lý các công việc được phân công</p>

      <div className="stats-grid">
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #2196f3 0%, #2196f3dd 100%)" }}>
          <h3 style={{ color: "white", margin: 0 }}>{requestStats.survey}</h3>
          <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Cần khảo sát</p>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #9c27b0 0%, #9c27b0dd 100%)" }}>
          <h3 style={{ color: "white", margin: 0 }}>{requestStats.waiting}</h3>
          <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Chờ thanh toán</p>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #00bcd4 0%, #00bcd4dd 100%)" }}>
          <h3 style={{ color: "white", margin: 0 }}>{requestStats.inProgress}</h3>
          <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Đang vận chuyển</p>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #4caf50 0%, #4caf50dd 100%)" }}>
          <h3 style={{ color: "white", margin: 0 }}>{requestStats.done}</h3>
          <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Đã hoàn thành</p>
        </div>
      </div>

      <div className="filters">
        <input
          placeholder="Tìm kiếm theo số điện thoại..."
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="filter-input"
          style={{ flex: 1, minWidth: "250px", maxWidth: "400px" }}
        />
        <Button onClick={onRefresh}>Làm mới</Button>
      </div>

      {requests.length > 0 && (
        <div className="filter-buttons" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Button
            variant={filterStatus === "" ? "primary" : "secondary"}
            onClick={() => setFilterStatus("")}
          >
            Tất cả ({requests.length})
          </Button>
          {Object.keys(STATUS_CONFIG).map((key) => {
            const count = requests.filter((r) => r.status === key).length;
            if (count === 0) return null;
            return (
              <Button
                key={key}
                variant={filterStatus === key ? "primary" : "secondary"}
                onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
              >
                {STATUS_CONFIG[key].label} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
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
              return (
                <Card key={r._id}>
                  <CardHeader>
                    <h3>Request #{shortId}</h3>
                    <StatusBadge status={r.status} />
                  </CardHeader>
                  <CardBody>
                    <div className="move-details">
                      <p><strong>Khách hàng:</strong> {r.customerName}</p>
                      <p><strong>SĐT:</strong> {r.customerPhone}</p>
                      <p><strong>Lấy hàng:</strong> {fmtAddress(r.pickupAddress || r.address)}</p>
                      <p><strong>Giao hàng:</strong> {fmtAddress(r.deliveryAddress || r.address)}</p>
                      <p><strong>Thời gian chuyển:</strong> {fmtDateTime24(r.movingTime)}</p>
                      {r.surveyFee && (
                        <p><strong>Phí khảo sát:</strong> {r.surveyFee.toLocaleString()}₫</p>
                      )}
                    </div>
                  </CardBody>
                  <CardActions>
                    {r.status === "UNDER_SURVEY" && (
                      <Button onClick={() => navigate(`/staff/survey/${r._id}`)}>
                        Khảo sát & Nhập đồ dùng
                      </Button>
                    )}
                    {r.status === "IN_PROGRESS" && (
                      <Button onClick={() => navigate(`/staff/task/${r._id}`)}>
                        Xem chi tiết & Cập nhật
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => navigate(`/requests/${r._id}/detail`)}>
                      Xem chi tiết
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

