// client/src/pages/QuoteSummaryPage.jsx - Màn 3: Tổng giá (hóa đơn)
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { estimateQuote } from "../api/quoteApi";
import { createRequest } from "../api/requestApi";

export default function QuoteSummaryPage() {
  const { state } = useLocation();
  const nav = useNavigate();
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const payload = {
          pickupLocation: state.pickupLocation,
          deliveryLocation: state.deliveryLocation,
          vehicleType: state.vehicleType || "1T",
          helpers: state.helpers || 2,
          extras: state.extras || [],
          serviceType: "STANDARD",
        };
        
        const result = await estimateQuote(payload);
        setQuote(result);
      } catch (e) {
        setMsg("❌ Không thể tính giá. Vui lòng thử lại.");
        console.error("Quote error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [state]);

  const handleSubmit = async () => {
    if (!quote) return;
    
    setSubmitting(true);
    setMsg("");
    
    try {
      // Tạo request với tất cả thông tin
      const requestData = {
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        pickupAddress: state.pickupAddress,
        deliveryAddress: state.deliveryAddress,
        pickupLocation: state.pickupLocation,
        deliveryLocation: state.deliveryLocation,
        movingTime: state.movingTime,
        serviceType: "STANDARD",
        status: "WAITING_PAYMENT", // Đã báo giá, chờ thanh toán
        notes: JSON.stringify({
          items: state.items || [],
          vehicleType: state.vehicleType,
          helpers: state.helpers,
          extras: state.extras,
          quoteTotal: quote.total,
        }),
      };

      const createdRequest = await createRequest(requestData);
      setMsg("✅ Đã tạo yêu cầu thành công!");
      
      setTimeout(() => {
        nav("/my-requests");
      }, 1500);
    } catch (err) {
      setMsg("❌ " + (err.message || "Có lỗi khi tạo yêu cầu"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div>Đang tính giá...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "red" }}>{msg || "Không thể tính giá"}</div>
        <button onClick={() => nav(-1)} style={btnStyle}>
          Quay lại
        </button>
      </div>
    );
  }

  // Tính các khoản chi tiết
  const baseDistanceFee = quote.distanceKm * (quote.perKm || 0);
  const laborFee = (state.helpers || 2) * 150000;
  const extrasFee = (state.extras || []).reduce((sum, key) => {
    // Tính phí dịch vụ thêm (tạm thời đơn giản)
    const prices = {
      wrap: 50000,
      disassemble: 80000,
      climb: 10000 * (state.climbFloors || 0),
      clean: 100000,
      storage: 200000,
    };
    return sum + (prices[key] || 0);
  }, 0);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <h1>Tổng giá dịch vụ</h1>
      
      {/* Thông tin khách hàng */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Thông tin khách hàng</h3>
        <div><strong>Tên:</strong> {state.customerName}</div>
        <div><strong>SĐT:</strong> {state.customerPhone}</div>
        <div><strong>Lấy hàng:</strong> {state.pickupAddressText}</div>
        <div><strong>Giao hàng:</strong> {state.deliveryAddressText}</div>
        <div><strong>Thời gian:</strong> {new Date(state.movingTime).toLocaleString("vi-VN")}</div>
      </div>

      {/* Đồ dùng */}
      {state.items && state.items.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Đồ dùng ({state.items.length} món)</h3>
          {state.items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 8, padding: 8, background: "#fff", borderRadius: 4 }}>
              <strong>{item.name}</strong>
              {item.weight && <span> • {item.weight}kg</span>}
              {item.length && item.width && item.height && (
                <span> • {item.length}×{item.width}×{item.height}cm</span>
              )}
              {item.isApartment && <span> • Nhà chung cư</span>}
            </div>
          ))}
        </div>
      )}

      {/* Hóa đơn chi tiết */}
      <div style={{ marginBottom: 24, padding: 16, border: "2px solid #111", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>HÓA ĐƠN</h2>
        
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <th style={{ textAlign: "left", padding: 12 }}>Mục</th>
              <th style={{ textAlign: "right", padding: 12 }}>Số tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 12 }}>
                Vận chuyển ({quote.distanceKm?.toFixed(1)} km × {quote.perKm?.toLocaleString()}₫/km)
              </td>
              <td style={{ textAlign: "right", padding: 12 }}>
                {baseDistanceFee?.toLocaleString()}₫
              </td>
            </tr>
            <tr>
              <td style={{ padding: 12 }}>
                Nhân công ({state.helpers || 2} người × 150.000₫)
              </td>
              <td style={{ textAlign: "right", padding: 12 }}>
                {laborFee.toLocaleString()}₫
              </td>
            </tr>
            {extrasFee > 0 && (
              <tr>
                <td style={{ padding: 12 }}>Dịch vụ thêm</td>
                <td style={{ textAlign: "right", padding: 12 }}>
                  {extrasFee.toLocaleString()}₫
                </td>
              </tr>
            )}
            <tr style={{ borderTop: "2px solid #111", fontWeight: "bold", fontSize: "1.2em" }}>
              <td style={{ padding: 12 }}>TỔNG CỘNG</td>
              <td style={{ textAlign: "right", padding: 12 }}>
                {quote.total?.toLocaleString()}₫
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 16, padding: 12, background: "#fff3cd", borderRadius: 6, fontSize: "0.9em" }}>
          ⚠️ Giá trên chỉ là ước tính. Giá cuối cùng có thể thay đổi tùy theo tình hình thực tế.
        </div>
      </div>

      {/* Nút hành động */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => nav(-1)} style={{ ...btnStyle, background: "#999" }}>
          ← Quay lại
        </button>
        <button 
          onClick={handleSubmit} 
          disabled={submitting}
          style={{ ...btnStyle, background: "#111", flex: 1 }}
        >
          {submitting ? "Đang xử lý..." : "Xác nhận và tạo yêu cầu"}
        </button>
      </div>

      {msg && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: msg.includes("✅") ? "#d4edda" : "#f8d7da", color: msg.includes("✅") ? "#155724" : "#721c24" }}>
          {msg}
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  padding: "12px 20px",
  border: "none",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

