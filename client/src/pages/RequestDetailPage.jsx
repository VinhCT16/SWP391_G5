// client/src/pages/RequestDetailPage.jsx - Chi tiết Request đầy đủ
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequest } from "../api/requestApi";
import { fmtDateTime24 } from "../utils/datetime";
import { fmtAddress } from "../utils/address";
import RouteMapLibre from "../components/RouteMapLibre";

const getStatusLabel = (status) => {
  const statusMap = {
    PENDING_CONFIRMATION: "Đang chờ xác nhận",
    UNDER_SURVEY: "Đang khảo sát",
    WAITING_PAYMENT: "Chờ thanh toán",
    IN_PROGRESS: "Đang vận chuyển",
    DONE: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
    REJECTED: "Bị từ chối",
    PENDING_REVIEW: "Đang chờ xác nhận",
    APPROVED: "Chờ thanh toán",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    PENDING_CONFIRMATION: { color: "#ff9800", bg: "#fff3e0" },
    UNDER_SURVEY: { color: "#2196f3", bg: "#e3f2fd" },
    WAITING_PAYMENT: { color: "#9c27b0", bg: "#f3e5f5" },
    IN_PROGRESS: { color: "#00bcd4", bg: "#e0f7fa" },
    DONE: { color: "#4caf50", bg: "#e8f5e9" },
    CANCELLED: { color: "#f44336", bg: "#ffebee" },
    REJECTED: { color: "#757575", bg: "#fafafa" },
    PENDING_REVIEW: { color: "#ff9800", bg: "#fff3e0" },
    APPROVED: { color: "#9c27b0", bg: "#f3e5f5" },
  };
  return colors[status] || { color: "#757575", bg: "#fafafa" };
};

// Convert GeoJSON -> {lat, lng}
function toLatLng(geo) {
  if (!geo) return null;
  if (geo.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length === 2) {
    return { lng: geo.coordinates[0], lat: geo.coordinates[1] };
  }
  if (typeof geo.lat === "number" && typeof geo.lng === "number") return geo;
  return null;
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
      const r = await getRequest(id);
      setReq(r);
      } catch (e) {
        setError("Không tải được request");
        console.error("Request detail error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 24, textAlign: "center" }}>Đang tải...</div>;
  }

  if (error || !req) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "red", marginBottom: 16 }}>{error || "Không tìm thấy request"}</div>
        <button onClick={() => nav("/my-requests")} style={btnStyle}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Parse notes để lấy thông tin báo giá (nếu có)
  let quoteInfo = null;
  try {
    if (req.notes) {
      quoteInfo = typeof req.notes === "string" ? JSON.parse(req.notes) : req.notes;
    }
  } catch (e) {
    // Notes không phải JSON, bỏ qua
  }

  const statusConfig = getStatusColor(req.status);
  const pickupLoc = toLatLng(req.pickupLocation || req.location);
  const deliveryLoc = toLatLng(req.deliveryLocation || req.location);

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Chi tiết Request</h1>
        <button onClick={() => nav("/my-requests")} style={btnStyle}>
          ← Quay lại
        </button>
      </div>

      {/* Mã request */}
      <div style={{ marginBottom: 16 }}>
        <code style={{ fontSize: "0.9em", color: "#666", background: "#f5f5f5", padding: "4px 8px", borderRadius: 4 }}>
          #{req._id?.slice(-12) || "N/A"}
        </code>
      </div>

      {/* Trạng thái */}
      <div style={{ marginBottom: 24, padding: 16, background: statusConfig.bg, borderRadius: 8, border: `2px solid ${statusConfig.color}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ color: statusConfig.color, fontSize: "1.1em" }}>
            Trạng thái: {getStatusLabel(req.status)}
          </strong>
          <div style={{ fontSize: "0.9em", color: "#666", marginLeft: "auto" }}>
            Tạo lúc: {new Date(req.createdAt || req.requestDate).toLocaleString("vi-VN")}
          </div>
        </div>
      </div>

      {/* Thông tin khách hàng */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Thông tin khách hàng</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <strong>Họ và tên:</strong> {req.customerName}
          </div>
          <div>
            <strong>Số điện thoại:</strong> {req.customerPhone}
          </div>
        </div>
      </div>

      {/* Địa chỉ */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Địa chỉ</h2>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <strong style={{ color: "#4caf50" }}>📍 Lấy hàng:</strong>
            <div style={{ marginTop: 4, padding: 8, background: "#fff", borderRadius: 4 }}>
              {fmtAddress(req.pickupAddress || req.address)}
            </div>
            {pickupLoc && (
              <div style={{ fontSize: "0.85em", color: "#666", marginTop: 4 }}>
                Tọa độ: {pickupLoc.lat.toFixed(6)}, {pickupLoc.lng.toFixed(6)}
              </div>
            )}
          </div>
          <div>
            <strong style={{ color: "#f44336" }}>🎯 Giao hàng:</strong>
            <div style={{ marginTop: 4, padding: 8, background: "#fff", borderRadius: 4 }}>
              {fmtAddress(req.deliveryAddress || req.address)}
            </div>
            {deliveryLoc && (
              <div style={{ fontSize: "0.85em", color: "#666", marginTop: 4 }}>
                Tọa độ: {deliveryLoc.lat.toFixed(6)}, {deliveryLoc.lng.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      {pickupLoc && deliveryLoc && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 12 }}>Tuyến đường</h2>
          <RouteMapLibre
            pickup={pickupLoc}
            delivery={deliveryLoc}
            height={400}
          />
        </div>
      )}

      {/* Thông tin dịch vụ */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Thông tin dịch vụ</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <strong>Thời gian chuyển:</strong> {fmtDateTime24(req.movingTime)}
          </div>
          <div>
            <strong>Loại dịch vụ:</strong> {req.serviceType === "EXPRESS" ? "Hỏa tốc" : "Thường"}
          </div>
          {req.surveyFee && (
            <div>
              <strong>Phí khảo sát:</strong> {req.surveyFee.toLocaleString()}₫
            </div>
          )}
        </div>
      </div>

      {/* Đồ dùng (nếu có trong quoteInfo) */}
      {quoteInfo?.items && quoteInfo.items.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Đồ dùng ({quoteInfo.items.length} món)</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {quoteInfo.items.map((item, idx) => (
              <div key={idx} style={{ padding: 12, background: "#fff", borderRadius: 6, border: "1px solid #ddd" }}>
                <strong>{item.name}</strong>
                {item.weight && <span> • {item.weight}kg</span>}
                {item.length && item.width && item.height && (
                  <span> • {item.length}×{item.width}×{item.height}cm</span>
                )}
                {item.isApartment && <span> • Nhà chung cư</span>}
                {item.images && item.images.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {item.images.map((img, imgIdx) => (
                      <img key={imgIdx} src={img} alt={`${item.name} ${imgIdx + 1}`} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thông tin báo giá (nếu có) */}
      {quoteInfo && (quoteInfo.vehicleType || quoteInfo.helpers || quoteInfo.extras || quoteInfo.quoteTotal) && (
        <div style={{ marginBottom: 24, padding: 16, background: "#e8f5e9", borderRadius: 8, border: "2px solid #4caf50" }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Thông tin báo giá</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {quoteInfo.vehicleType && (
              <div>
                <strong>Loại xe:</strong> {quoteInfo.vehicleType}
              </div>
            )}
            {quoteInfo.helpers && (
              <div>
                <strong>Số nhân công:</strong> {quoteInfo.helpers} người
              </div>
            )}
            {quoteInfo.extras && quoteInfo.extras.length > 0 && (
              <div>
                <strong>Dịch vụ thêm:</strong>{" "}
                {quoteInfo.extras.map((e) => {
                  const names = {
                    wrap: "Gói đồ kỹ",
                    disassemble: "Tháo/lắp nội thất",
                    climb: "Vận chuyển tầng cao",
                    clean: "Vệ sinh",
                    storage: "Lưu kho",
                  };
                  return names[e] || e;
                }).join(", ")}
              </div>
            )}
            {quoteInfo.quoteTotal && (
              <div style={{ marginTop: 8, padding: 12, background: "#fff", borderRadius: 6 }}>
                <strong style={{ fontSize: "1.2em", color: "#4caf50" }}>
                  Tổng giá: {quoteInfo.quoteTotal.toLocaleString()}₫
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ảnh (nếu có) */}
      {req.images && req.images.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Ảnh đính kèm ({req.images.length})</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {req.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Ảnh ${idx + 1}`}
                style={{
                  width: 150,
                  height: 150,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                }}
                onClick={() => window.open(img, "_blank")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ghi chú */}
      {req.notes && !quoteInfo && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Ghi chú</h2>
          <div style={{ whiteSpace: "pre-wrap" }}>{req.notes}</div>
        </div>
      )}

      {/* Thời gian */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Thời gian</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <strong>Ngày tạo:</strong> {new Date(req.createdAt || req.requestDate).toLocaleString("vi-VN")}
          </div>
          {req.estimatedDelivery && (
            <div>
              <strong>Dự kiến giao:</strong> {new Date(req.estimatedDelivery).toLocaleString("vi-VN")}
            </div>
          )}
          {req.actualDelivery && (
            <div>
              <strong>Thực tế giao:</strong> {new Date(req.actualDelivery).toLocaleString("vi-VN")}
            </div>
          )}
          <div>
            <strong>Thời gian chuyển:</strong> {fmtDateTime24(req.movingTime)}
          </div>
        </div>
      </div>

      {/* Hành động */}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        {["PENDING_CONFIRMATION", "PENDING_REVIEW"].includes(req.status) && (
          <button
            onClick={() => nav(`/requests/${id}/edit`)}
            style={{ ...btnStyle, background: "#2196f3" }}
          >
            Sửa request
          </button>
        )}
        {["PENDING_CONFIRMATION", "UNDER_SURVEY", "WAITING_PAYMENT", "PENDING_REVIEW"].includes(req.status) && (
          <button
            onClick={async () => {
              if (!window.confirm("Bạn có chắc chắn muốn hủy request này không?")) return;
              try {
                const { cancelRequest } = await import("../api/requestApi");
                await cancelRequest(id);
                nav("/my-requests");
              } catch (err) {
                alert("Lỗi khi hủy: " + (err.message || "Vui lòng thử lại"));
              }
            }}
            style={{ ...btnStyle, background: "#f44336" }}
          >
            Hủy request
          </button>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "10px 16px",
  border: "none",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};
