// client/src/pages/request/RequestDetailPage.jsx - Chi tiết Request đầy đủ
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRequest, cancelRequest, updateRequestStatus } from "../../api/requestApi";
import { createVNPayPayment } from "../../api/paymentApi";
import { fmtDateTime24 } from "../../utils/datetime";
import { fmtAddress } from "../../utils/address";
import RouteMapLibre from "../../components/map/RouteMapLibre";
import ApprovalModal from "../../components/dashboard/ApprovalModal";

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
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalActionType, setApprovalActionType] = useState('approve');
  const [processing, setProcessing] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await getRequest(id);
        // getRequest returns { request: {...} } or direct request object
        const requestData = response.request || response;
        setReq(requestData);
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

  const handlePayment = async () => {
    try {
      if (!window.confirm(`Bạn có chắc chắn muốn thanh toán cho request này?`)) {
        return;
      }
      
      setPaying(true);
      const response = await createVNPayPayment(req._id);
      
      if (response.paymentUrl) {
        // Redirect to VNPay payment page
        window.location.href = response.paymentUrl;
      } else {
        alert("❌ Không thể tạo link thanh toán. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("❌ Lỗi khi tạo thanh toán: " + (err.message || "Vui lòng thử lại"));
    } finally {
      setPaying(false);
    }
  };

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
            <strong>Họ và tên:</strong> {req.customerName || "N/A"}
          </div>
          <div>
            <strong>Số điện thoại:</strong> {req.customerPhone || req.moveDetails?.phone || "N/A"}
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
              {req.pickupAddress 
                ? fmtAddress(req.pickupAddress) 
                : req.moveDetails?.fromAddress 
                ? req.moveDetails.fromAddress 
                : fmtAddress(req.address) || "N/A"}
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
              {req.deliveryAddress 
                ? fmtAddress(req.deliveryAddress) 
                : req.moveDetails?.toAddress 
                ? req.moveDetails.toAddress 
                : fmtAddress(req.address) || "N/A"}
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
            <strong>Thời gian chuyển:</strong> {fmtDateTime24(req.movingTime || req.moveDetails?.moveDate)}
          </div>
          <div>
            <strong>Loại dịch vụ:</strong> {
              req.serviceType === "EXPRESS" || req.moveDetails?.serviceType === "Long Distance" 
                ? "Hỏa tốc" 
                : req.moveDetails?.serviceType || "Thường"
            }
          </div>
          {req.surveyFee && (
            <div>
              <strong>Phí khảo sát:</strong> {req.surveyFee.toLocaleString()}₫
            </div>
          )}
        </div>
      </div>

      {/* Đồ dùng - Check both quoteInfo and request.items */}
      {((quoteInfo?.items && quoteInfo.items.length > 0) || (req.items && req.items.length > 0)) && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>
            Đồ dùng ({(quoteInfo?.items?.length || req.items?.length || 0)} món)
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {(req.items || quoteInfo?.items || []).map((item, idx) => (
              <div key={idx} style={{ padding: 12, background: "#fff", borderRadius: 6, border: "1px solid #ddd" }}>
                <strong>{item.description || item.name || `Item ${idx + 1}`}</strong>
                {item.quantity && <span> • Số lượng: {item.quantity}</span>}
                {item.category && <span> • Loại: {item.category}</span>}
                {item.weight && <span> • {item.weight}kg</span>}
                {item.dimensions?.weight && <span> • {item.dimensions.weight}kg</span>}
                {item.length && item.width && item.height && (
                  <span> • {item.length}×{item.width}×{item.height}cm</span>
                )}
                {item.dimensions?.length && item.dimensions.width && item.dimensions.height && (
                  <span> • {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height}cm</span>
                )}
                {(item.isApartment || item.requiresSpecialHandling) && <span> • ⚠️ Cần xử lý đặc biệt</span>}
                {(item.images && item.images.length > 0) && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {item.images.map((img, imgIdx) => (
                      <img key={imgIdx} src={img} alt={`${item.description || item.name} ${imgIdx + 1}`} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }} />
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

      {/* Payment Information */}
      {req.paymentMethod && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Thông tin thanh toán</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <strong>Phương thức:</strong> {
                req.paymentMethod === "online_banking" ? "🏦 Thanh toán online (VNPay)" : "💵 Thanh toán bằng tiền mặt"
              }
            </div>
            <div>
              <strong>Trạng thái thanh toán:</strong> {
                req.paymentStatus === "deposit_paid" ? "✅ Đã thanh toán cọc" :
                req.paymentStatus === "fully_paid" ? "✅ Đã thanh toán đủ" :
                req.paymentStatus === "not_paid" ? "❌ Thanh toán thất bại" :
                "⏳ Chờ thanh toán"
              }
            </div>
            {req.depositPaid && req.depositPaidAt && (
              <div>
                <strong>Đã thanh toán cọc lúc:</strong> {new Date(req.depositPaidAt).toLocaleString("vi-VN")}
              </div>
            )}
            {req.vnpayTransaction && (
              <div style={{ padding: 12, background: "#fff", borderRadius: 6, marginTop: 8 }}>
                <strong>Thông tin giao dịch VNPay:</strong>
                <div style={{ marginTop: 8, fontSize: "0.9em" }}>
                  <div>Mã giao dịch: {req.vnpayTransaction.transactionId}</div>
                  <div>Số tiền: {req.vnpayTransaction.amount?.toLocaleString('vi-VN')} ₫</div>
                  <div>Ngày thanh toán: {req.vnpayTransaction.paymentDate ? new Date(req.vnpayTransaction.paymentDate).toLocaleString("vi-VN") : "N/A"}</div>
                </div>
              </div>
            )}
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
            <strong>Thời gian chuyển:</strong> {fmtDateTime24(req.movingTime || req.moveDetails?.moveDate)}
          </div>
        </div>
      </div>

      {/* Hành động */}
      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        {/* Manager actions for PENDING requests */}
        {user?.role === 'manager' && (req.status === 'PENDING' || req.status === 'submitted') && (
          <>
            <button
              onClick={() => {
                setApprovalActionType('approve');
                setShowApprovalModal(true);
              }}
              style={{ ...btnStyle, background: "#4caf50" }}
            >
              ✅ Approve Request
            </button>
            <button
              onClick={() => {
                setApprovalActionType('reject');
                setShowApprovalModal(true);
              }}
              style={{ ...btnStyle, background: "#f44336" }}
            >
              ❌ Deny Request
            </button>
          </>
        )}
        
        {/* Customer actions */}
        {user?.role === 'customer' && ["PENDING_CONFIRMATION", "PENDING_REVIEW"].includes(req.status) && (
          <button
            onClick={() => nav(`/requests/${id}/edit`)}
            style={{ ...btnStyle, background: "#2196f3" }}
          >
            ✏️ Sửa request
          </button>
        )}
        {user?.role === 'customer' && ["PENDING_CONFIRMATION", "UNDER_SURVEY", "WAITING_PAYMENT", "PENDING_REVIEW"].includes(req.status) && (
          <button
            onClick={async () => {
              if (!window.confirm("Bạn có chắc chắn muốn hủy request này không?")) return;
              try {
                await cancelRequest(id);
                alert("Đã hủy request thành công");
                nav("/my-requests");
              } catch (err) {
                alert("Lỗi khi hủy: " + (err.message || "Vui lòng thử lại"));
              }
            }}
            style={{ ...btnStyle, background: "#f44336" }}
          >
            🗑️ Hủy request
          </button>
        )}
        {/* Payment button for online banking requests */}
        {user?.role === 'customer' && 
         (req.status === "WAITING_PAYMENT" || req.status === "UNDER_SURVEY" || req.status === "PENDING") && 
         req.paymentMethod === "online_banking" && 
         req.paymentStatus !== "deposit_paid" && 
         req.paymentStatus !== "fully_paid" && (
          <button
            onClick={handlePayment}
            disabled={paying}
            style={{ 
              ...btnStyle, 
              background: paying ? "#ccc" : "#4caf50",
              cursor: paying ? "not-allowed" : "pointer"
            }}
          >
            {paying ? "Đang xử lý..." : "💳 Thanh toán VNPay"}
          </button>
        )}
      </div>

      {/* Approval Modal for Managers */}
      {user?.role === 'manager' && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setProcessing(false);
          }}
          request={req}
          actionType={approvalActionType}
          loading={processing}
          onApprove={async (requestId, approvalData) => {
            try {
              setProcessing(true);
              await updateRequestStatus(requestId, approvalData);
              const successMessage = approvalActionType === 'approve' 
                ? 'Request approved successfully! Email with contract PDF has been sent to customer.'
                : 'Request denied successfully! Email notification has been sent to customer.';
              alert(successMessage);
              setShowApprovalModal(false);
              // Navigate back to manager dashboard
              nav('/manager-dashboard');
            } catch (err) {
              alert('Error: ' + (err.message || `Failed to ${approvalActionType} request`));
            } finally {
              setProcessing(false);
            }
          }}
        />
      )}
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
