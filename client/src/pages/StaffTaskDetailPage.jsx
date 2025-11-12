// client/src/pages/staff/StaffTaskDetailPage.jsx - Chi tiết task và cập nhật trạng thái
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequest, updateRequest } from "../../api/requestApi";
import { fmtAddress } from "../../utils/address";
import { fmtDateTime24 } from "../../utils/datetime";
import RouteMapLibre from "../../components/map/RouteMapLibre";
import "../../styles/movingService.css";

const STATUS_CONFIG = {
  WAITING_PAYMENT: { label: "Chờ thanh toán", color: "#9c27b0", bg: "#f3e5f5" },
  IN_PROGRESS: { label: "Đang vận chuyển", color: "#00bcd4", bg: "#e0f7fa" },
  DONE: { label: "Đã hoàn thành", color: "#4caf50", bg: "#e8f5e9" },
};

export default function StaffTaskDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const data = await getRequest(id);
      setRequest(data);
      setNewStatus(data.status);
    } catch (err) {
      setMsg("❌ Không tải được thông tin request: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!request || newStatus === request.status) {
      setMsg("⚠️ Trạng thái không thay đổi");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn cập nhật trạng thái thành "${STATUS_CONFIG[newStatus]?.label || newStatus}"?`)) {
      return;
    }

    try {
      setUpdating(true);
      setMsg("");

      // Cập nhật status và actualDelivery nếu hoàn thành
      const updateData = { status: newStatus };
      if (newStatus === "DONE" && !request.actualDelivery) {
        updateData.actualDelivery = new Date();
      }

      await updateRequest(id, updateData);
      setRequest(prev => ({ ...prev, ...updateData }));
      setMsg("✅ Cập nhật trạng thái thành công!");
      
      setTimeout(() => nav("/staff/dashboard"), 1500);
    } catch (err) {
      setMsg("❌ Lỗi khi cập nhật: " + (err.message || "Lỗi không xác định"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="moving-service-container">
        <div className="content-wrapper">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Đang tải thông tin task...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="moving-service-container">
        <div className="content-wrapper">
          <div className="empty-state">
            <h3>Không tìm thấy task</h3>
            <button className="btn btn-primary" onClick={() => nav("/staff/dashboard")}>
              Quay lại Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status] || { label: request.status, color: "#757575", bg: "#fafafa" };
  const pickupLoc = request.pickupLocation?.coordinates 
    ? { lat: request.pickupLocation.coordinates[1], lng: request.pickupLocation.coordinates[0] }
    : null;
  const deliveryLoc = request.deliveryLocation?.coordinates
    ? { lat: request.deliveryLocation.coordinates[1], lng: request.deliveryLocation.coordinates[0] }
    : null;

  let quoteInfo = null;
  try {
    if (request.notes) quoteInfo = JSON.parse(request.notes);
  } catch (e) {
    console.warn("Could not parse notes:", e);
  }

  return (
    <div className="moving-service-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1>Chi Tiết Task</h1>
          <p>Request #{request._id.slice(-8)}</p>
        </div>

        {msg && (
          <div className={`message ${msg.includes("✅") ? "success" : msg.includes("⚠️") ? "info" : "error"}`}>
            {msg}
          </div>
        )}

        {/* Status Info */}
        <div className="main-card">
          <div style={{ padding: "1rem", background: statusConfig.bg, borderRadius: 8, border: `2px solid ${statusConfig.color}`, marginBottom: "1.5rem" }}>
            <strong>Trạng thái hiện tại:</strong>{" "}
            <span style={{ color: statusConfig.color, fontWeight: "bold", fontSize: "1.1em" }}>
              {statusConfig.label}
            </span>
          </div>

          {/* Update Status (chỉ cho IN_PROGRESS và WAITING_PAYMENT) */}
          {["WAITING_PAYMENT", "IN_PROGRESS"].includes(request.status) && (
            <div className="form-section">
              <h3>Cập nhật trạng thái</h3>
              <div className="form-group">
                <label>Trạng thái mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={updating}
                >
                  {request.status === "WAITING_PAYMENT" && (
                    <option value="WAITING_PAYMENT">Chờ thanh toán</option>
                  )}
                  {request.status === "WAITING_PAYMENT" && (
                    <option value="IN_PROGRESS">Đang vận chuyển</option>
                  )}
                  {request.status === "IN_PROGRESS" && (
                    <option value="IN_PROGRESS">Đang vận chuyển</option>
                  )}
                  {request.status === "IN_PROGRESS" && (
                    <option value="DONE">Đã hoàn thành</option>
                  )}
                </select>
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === request.status}
                className="btn btn-primary"
              >
                {updating ? "Đang cập nhật..." : "Cập nhật trạng thái"}
              </button>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="main-card">
          <h2 style={{ marginTop: 0 }}>Thông tin khách hàng</h2>
          <div className="move-details">
            <p><strong>Họ và tên:</strong> {request.customerName}</p>
            <p><strong>Số điện thoại:</strong> {request.customerPhone}</p>
          </div>
        </div>

        {/* Address Info */}
        <div className="main-card">
          <h2 style={{ marginTop: 0 }}>Địa chỉ</h2>
          <div className="move-details">
            <p>
              <strong style={{ color: "#4caf50" }}>📍 Lấy hàng:</strong> {fmtAddress(request.pickupAddress || request.address)}
            </p>
            <p>
              <strong style={{ color: "#f44336" }}>🎯 Giao hàng:</strong> {fmtAddress(request.deliveryAddress || request.address)}
            </p>
            <p><strong>Thời gian chuyển:</strong> {fmtDateTime24(request.movingTime)}</p>
          </div>
        </div>

        {/* Map */}
        {pickupLoc && deliveryLoc && (
          <div className="main-card">
            <h2 style={{ marginTop: 0 }}>Tuyến đường</h2>
            <RouteMapLibre
              pickup={pickupLoc}
              delivery={deliveryLoc}
              height={400}
            />
          </div>
        )}

        {/* Items Info */}
        {quoteInfo?.items && quoteInfo.items.length > 0 && (
          <div className="main-card">
            <h2 style={{ marginTop: 0 }}>Đồ dùng ({quoteInfo.items.length} món)</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {quoteInfo.items.map((item, idx) => (
                <div key={idx} style={{ padding: "1rem", background: "#f8f9fa", borderRadius: 6, border: "1px solid #e9ecef" }}>
                  <strong>{item.name}</strong>
                  {item.weight && <span> • {item.weight}kg</span>}
                  {item.length && item.width && item.height && (
                    <span> • {item.length}×{item.width}×{item.height}cm</span>
                  )}
                  {item.isApartment && <span> • Nhà chung cư</span>}
                  {item.images && item.images.length > 0 && (
                    <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {item.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt={`${item.name} ${imgIdx + 1}`}
                          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quote Info */}
        {quoteInfo && quoteInfo.quoteTotal && (
          <div className="main-card" style={{ background: "#e8f5e9", border: "2px solid #4caf50" }}>
            <h2 style={{ marginTop: 0, color: "#2e7d32" }}>Thông tin báo giá</h2>
            <div className="move-details">
              {quoteInfo.vehicleType && <p><strong>Loại xe:</strong> {quoteInfo.vehicleType}</p>}
              {quoteInfo.helpers && <p><strong>Số nhân công:</strong> {quoteInfo.helpers} người</p>}
              {quoteInfo.extras && quoteInfo.extras.length > 0 && (
                <p>
                  <strong>Dịch vụ thêm:</strong>{" "}
                  {quoteInfo.extras.map((e) => {
                    const names = {
                      wrap: "Gói đồ kỹ",
                      disassemble: "Tháo/lắp nội thất",
                      climb: `Vận chuyển tầng cao (${quoteInfo.climbFloors || 0} tầng)`,
                      clean: "Vệ sinh",
                      storage: `Lưu kho (${quoteInfo.storageMonths || 0} tháng)`,
                    };
                    return names[e] || e;
                  }).join(", ")}
                </p>
              )}
              <p style={{ marginTop: "1rem", padding: "1rem", background: "white", borderRadius: 6 }}>
                <strong style={{ fontSize: "1.2em", color: "#2e7d32" }}>
                  Tổng giá: {quoteInfo.quoteTotal.toLocaleString()}₫
                </strong>
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button onClick={() => nav("/staff/dashboard")} className="btn btn-secondary" style={{ flex: 1 }}>
            ← Quay lại Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

