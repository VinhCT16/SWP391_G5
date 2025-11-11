// client/src/pages/QuoteSummaryPage.jsx - Màn 3: Tổng giá (hóa đơn)
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { estimateQuote } from "../api/quoteApi";
import { createRequest, getRequest } from "../api/requestApi";

// Convert GeoJSON -> {lat, lng}
function toLatLng(geo) {
  if (!geo) return null;
  if (geo.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length === 2) {
    return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
  }
  if (typeof geo.lat === "number" && typeof geo.lng === "number") return geo;
  return null;
}

export default function QuoteSummaryPage() {
  const { state } = useLocation();
  const nav = useNavigate();
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let finalState = state;
        
        // Nếu state chỉ có requestId, load request từ API
        if (state?.requestId && !state.pickupLocation) {
          console.log("📥 [QuoteSummary] Loading request từ requestId:", state.requestId);
          const request = await getRequest(state.requestId);
          setRequestData(request);
          
          // Parse notes để lấy quote info
          let quoteInfo = null;
          try {
            if (request.notes) {
              quoteInfo = typeof request.notes === "string" ? JSON.parse(request.notes) : request.notes;
            }
          } catch (e) {
            console.warn("Could not parse notes:", e);
          }
          
          // Convert locations từ GeoJSON sang {lat, lng}
          const pickupLoc = toLatLng(request.pickupLocation || request.location);
          const deliveryLoc = toLatLng(request.deliveryLocation || request.location);
          
          // Tạo state từ request data
          finalState = {
            customerName: request.customerName,
            customerPhone: request.customerPhone,
            pickupAddress: request.pickupAddress || request.address,
            deliveryAddress: request.deliveryAddress || request.address,
            pickupAddressText: request.pickupAddressText || (request.pickupAddress ? 
              `${request.pickupAddress.street}, ${request.pickupAddress.ward?.name}, ${request.pickupAddress.district?.name}, ${request.pickupAddress.province?.name}` : ""),
            deliveryAddressText: request.deliveryAddressText || (request.deliveryAddress ? 
              `${request.deliveryAddress.street}, ${request.deliveryAddress.ward?.name}, ${request.deliveryAddress.district?.name}, ${request.deliveryAddress.province?.name}` : ""),
            pickupLocation: pickupLoc,
            deliveryLocation: deliveryLoc,
            movingTime: request.movingTime,
            // Lấy từ quoteInfo nếu có
            items: quoteInfo?.items || [],
            vehicleType: quoteInfo?.vehicleType || "1T",
            helpers: quoteInfo?.helpers || 2,
            extras: quoteInfo?.extras || [],
            climbFloors: quoteInfo?.climbFloors || 0,
            storageMonths: quoteInfo?.storageMonths || 0,
          };
          
          console.log("✅ [QuoteSummary] Đã load request, finalState:", {
            ...finalState,
            pickupLocation: finalState.pickupLocation ? "✓" : "✗",
            deliveryLocation: finalState.deliveryLocation ? "✓" : "✗",
            items: finalState.items?.length || 0,
          });
        }
        
        // Validate locations
        if (!finalState.pickupLocation || !finalState.deliveryLocation) {
          throw new Error("Thiếu thông tin địa chỉ. Không thể tính giá.");
        }
        
        const payload = {
          pickupLocation: finalState.pickupLocation,
          deliveryLocation: finalState.deliveryLocation,
          vehicleType: finalState.vehicleType || "1T",
          helpers: finalState.helpers || 2,
          extras: finalState.extras || [],
          items: finalState.items || [],
          climbFloors: finalState.climbFloors || 0,
          storageMonths: finalState.storageMonths || 0,
          serviceType: "STANDARD",
        };
        
        console.log("📤 [QuoteSummary] Gửi payload để tính quote:", {
          ...payload,
          pickupLocation: payload.pickupLocation ? "✓" : "✗",
          deliveryLocation: payload.deliveryLocation ? "✓" : "✗",
        });
        
        const result = await estimateQuote(payload);
        console.log("✅ [QuoteSummary] Nhận được quote:", result);
        setQuote(result);
      } catch (e) {
        setMsg("❌ Không thể tính giá. Vui lòng thử lại.");
        console.error("❌ [QuoteSummary] Quote error:", e);
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

  // Lấy các khoản từ quote breakdown (đã tính chính xác từ backend)
  const vehicleFee = quote.vehicleFee || 0;
  const laborFee = quote.laborFee || 0;
  const extrasFee = quote.extrasFee || 0;
  const itemFee = quote.itemFee || 0;
  const calculatedTotal = vehicleFee + laborFee + extrasFee + itemFee;
  
  // Sử dụng total từ backend (đã apply minTripFee và express multiplier nếu có)
  const finalTotal = quote.total || calculatedTotal;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <h1>Tổng giá dịch vụ</h1>
      
      {/* Thông tin khách hàng */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Thông tin khách hàng</h3>
        <div><strong>Tên:</strong> {state?.customerName || requestData?.customerName || "N/A"}</div>
        <div><strong>SĐT:</strong> {state?.customerPhone || requestData?.customerPhone || "N/A"}</div>
        <div><strong>Lấy hàng:</strong> {state?.pickupAddressText || (requestData?.pickupAddress ? 
          `${requestData.pickupAddress.street}, ${requestData.pickupAddress.ward?.name}, ${requestData.pickupAddress.district?.name}, ${requestData.pickupAddress.province?.name}` : "N/A")}</div>
        <div><strong>Giao hàng:</strong> {state?.deliveryAddressText || (requestData?.deliveryAddress ? 
          `${requestData.deliveryAddress.street}, ${requestData.deliveryAddress.ward?.name}, ${requestData.deliveryAddress.district?.name}, ${requestData.deliveryAddress.province?.name}` : "N/A")}</div>
        <div><strong>Thời gian:</strong> {new Date(state?.movingTime || requestData?.movingTime || Date.now()).toLocaleString("vi-VN")}</div>
      </div>

      {/* Đồ dùng */}
      {(state?.items || requestData) && (state?.items?.length > 0 || (() => {
        try {
          const notes = requestData?.notes;
          if (notes) {
            const quoteInfo = typeof notes === "string" ? JSON.parse(notes) : notes;
            return quoteInfo?.items?.length > 0;
          }
        } catch (e) {}
        return false;
      })()) && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Đồ dùng ({(() => {
            const items = state?.items || (() => {
              try {
                const notes = requestData?.notes;
                if (notes) {
                  const quoteInfo = typeof notes === "string" ? JSON.parse(notes) : notes;
                  return quoteInfo?.items || [];
                }
              } catch (e) {}
              return [];
            })();
            return items.length;
          })()} món)</h3>
          {(() => {
            const items = state?.items || (() => {
              try {
                const notes = requestData?.notes;
                if (notes) {
                  const quoteInfo = typeof notes === "string" ? JSON.parse(notes) : notes;
                  return quoteInfo?.items || [];
                }
              } catch (e) {}
              return [];
            })();
            return items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 8, padding: 8, background: "#fff", borderRadius: 4 }}>
              <strong>{item.name}</strong>
              {item.weight && <span> • {item.weight}kg</span>}
              {item.length && item.width && item.height && (
                <span> • {item.length}×{item.width}×{item.height}cm</span>
              )}
              {item.isApartment && <span> • Nhà chung cư</span>}
            </div>
            ));
          })()}
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
                Vận chuyển ({quote.distanceKm?.toFixed(1)} km × {quote.perKm?.toLocaleString()}₫/km
                {quote.minTripFee && vehicleFee >= quote.minTripFee ? `, tối thiểu ${quote.minTripFee?.toLocaleString()}₫` : ""})
              </td>
              <td style={{ textAlign: "right", padding: 12 }}>
                {vehicleFee.toLocaleString()}₫
              </td>
            </tr>
            <tr>
              <td style={{ padding: 12 }}>
                Nhân công ({state?.helpers || (() => {
                  try {
                    const notes = requestData?.notes;
                    if (notes) {
                      const quoteInfo = typeof notes === "string" ? JSON.parse(notes) : notes;
                      return quoteInfo?.helpers || 2;
                    }
                  } catch (e) {}
                  return 2;
                })()} người × 150.000₫)
              </td>
              <td style={{ textAlign: "right", padding: 12 }}>
                {laborFee.toLocaleString()}₫
              </td>
            </tr>
            {extrasFee > 0 && (
              <tr>
                <td style={{ padding: 12 }}>
                  Dịch vụ thêm
                  {(() => {
                    const extras = state?.extras || (() => {
                      try {
                        const notes = requestData?.notes;
                        if (notes) {
                          const quoteInfo = typeof notes === "string" ? JSON.parse(notes) : notes;
                          return quoteInfo?.extras || [];
                        }
                      } catch (e) {}
                      return [];
                    })();
                    const climbFloors = state?.climbFloors || (() => {
                      try {
                        const notes = requestData?.notes;
                        if (notes) {
                          const quoteInfo = typeof notes === "string" ? JSON.parse(notes) : notes;
                          return quoteInfo?.climbFloors || 0;
                        }
                      } catch (e) {}
                      return 0;
                    })();
                    const storageMonths = state?.storageMonths || (() => {
                      try {
                        const notes = requestData?.notes;
                        if (notes) {
                          const quoteInfo = typeof notes === "string" ? JSON.parse(notes) : notes;
                          return quoteInfo?.storageMonths || 0;
                        }
                      } catch (e) {}
                      return 0;
                    })();
                    return extras.length > 0 && (
                      <div style={{ fontSize: "0.85em", color: "#666", marginTop: 4 }}>
                        {extras.map((e, i) => {
                          const names = {
                            wrap: "Gói đồ kỹ",
                            disassemble: "Tháo/lắp nội thất",
                            climb: `Vận chuyển tầng cao (${climbFloors} tầng)`,
                            clean: "Vệ sinh",
                            storage: `Lưu kho${storageMonths > 0 ? ` (${storageMonths} tháng)` : ""}`,
                          };
                          return names[e] || e;
                        }).filter(Boolean).join(", ")}
                      </div>
                    );
                  })()}
                </td>
                <td style={{ textAlign: "right", padding: 12 }}>
                  {extrasFee.toLocaleString()}₫
                </td>
              </tr>
            )}
            {itemFee > 0 && (
              <tr>
                <td style={{ padding: 12 }}>
                  Phí theo thể tích đồ dùng
                  {(() => {
                    const items = state?.items || (() => {
                      try {
                        const notes = requestData?.notes;
                        if (notes) {
                          const quoteInfo = typeof notes === "string" ? JSON.parse(notes) : notes;
                          return quoteInfo?.items || [];
                        }
                      } catch (e) {}
                      return [];
                    })();
                    return items.length > 0 && (
                      <div style={{ fontSize: "0.85em", color: "#666", marginTop: 4 }}>
                        {items.length} món đồ
                      </div>
                    );
                  })()}
                </td>
                <td style={{ textAlign: "right", padding: 12 }}>
                  {itemFee.toLocaleString()}₫
                </td>
              </tr>
            )}
            <tr style={{ borderTop: "2px solid #111", fontWeight: "bold", fontSize: "1.2em" }}>
              <td style={{ padding: 12 }}>TỔNG CỘNG</td>
              <td style={{ textAlign: "right", padding: 12 }}>
                {finalTotal.toLocaleString()}₫
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 16, padding: 12, background: "#fff3cd", borderRadius: 6, fontSize: "0.9em" }}>
          ⚠️ Giá trên chỉ là ước tính. Giá cuối cùng có thể thay đổi tùy theo tình hình thực tế.
        </div>
      </div>

      {/* Nút hành động */}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button onClick={() => nav(-1)} style={{ ...btnStyle, background: "#999", flex: 1 }}>
          ← Quay lại
        </button>
        <button 
          onClick={() => {
            // Tạm thời chỉ hiển thị thông báo, sau này sẽ tích hợp payment
            alert(`Tổng tiền: ${finalTotal.toLocaleString()}₫\n\nTính năng thanh toán đang được phát triển. Vui lòng liên hệ với chúng tôi để thanh toán.`);
          }}
          style={{ ...btnStyle, background: "#4caf50", flex: 1 }}
        >
          💳 Tính tiền
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

