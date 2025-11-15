import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isValidVNMobile, normalizeVNPhone, validateMovingTime } from "../../utils/validation";
import { nowForDatetimeLocal } from "../../utils/datetime";
import AddressPicker from "../../components/address/AddressPicker";
import RouteMapLibre from "../../components/map/RouteMapLibre";
import { osmGeocode, osrmRoute, joinAddress, isAddressComplete } from "../../utils/ors";
import { createRequest } from "../../api/requestApi";
import "../../styles/movingService.css";

export default function CreateRequestPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    pickupAddress: { province: null, district: null, ward: null, street: "" },
    pickupLocation: null,
    deliveryAddress: { province: null, district: null, ward: null, street: "" },
    deliveryLocation: null,
    movingTime: "",
    requestType: null, // "SELF_SERVICE" hoặc "STAFF_SURVEY"
    paymentMethod: "cash", // "cash" or "online_banking"
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationWarnings, setLocationWarnings] = useState({
    pickup: null,
    delivery: null,
  });

  // Route preview state
  const [routeGeo, setRouteGeo] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);

  /** ====== Xác định toạ độ trung tâm bias theo tỉnh/quận ====== */
  function resolveFocus(addr) {
    if (!addr) return { lat: 16.2, lng: 107.8 }; // Mặc định: Huế
    
    const provinceName = addr?.province?.name || "";
    const districtName = addr?.district?.name || "";
    
    // Tọa độ trung tâm các tỉnh/thành phố lớn
    const provinceCenters = {
      "Hà Nội": { lat: 21.028, lng: 105.854 },
      "Hồ Chí Minh": { lat: 10.77, lng: 106.69 },
      "HCM": { lat: 10.77, lng: 106.69 },
      "Đà Nẵng": { lat: 16.054, lng: 108.202 },
      "Hải Phòng": { lat: 20.864, lng: 106.683 },
      "Cần Thơ": { lat: 10.045, lng: 105.746 },
      "An Giang": { lat: 10.521, lng: 105.125 },
      "Bà Rịa - Vũng Tàu": { lat: 10.346, lng: 107.242 },
      "Bắc Giang": { lat: 21.273, lng: 106.195 },
      "Bắc Kạn": { lat: 22.147, lng: 105.834 },
      "Bạc Liêu": { lat: 9.294, lng: 105.724 },
      "Bắc Ninh": { lat: 21.186, lng: 106.076 },
      "Bến Tre": { lat: 10.241, lng: 106.376 },
      "Bình Định": { lat: 13.776, lng: 109.223 },
      "Bình Dương": { lat: 11.325, lng: 106.477 },
      "Bình Phước": { lat: 11.751, lng: 106.723 },
      "Bình Thuận": { lat: 10.929, lng: 108.102 },
      "Cà Mau": { lat: 9.177, lng: 105.152 },
      "Cao Bằng": { lat: 22.664, lng: 106.257 },
      "Đắk Lắk": { lat: 12.666, lng: 108.050 },
      "Đắk Nông": { lat: 12.004, lng: 107.691 },
      "Điện Biên": { lat: 21.392, lng: 103.016 },
      "Đồng Nai": { lat: 10.957, lng: 106.822 },
      "Đồng Tháp": { lat: 10.493, lng: 105.633 },
      "Gia Lai": { lat: 13.984, lng: 108.001 },
      "Hà Giang": { lat: 22.831, lng: 104.984 },
      "Hà Nam": { lat: 20.543, lng: 105.922 },
      "Hà Tĩnh": { lat: 18.343, lng: 105.906 },
      "Hải Dương": { lat: 20.937, lng: 106.330 },
      "Hậu Giang": { lat: 9.785, lng: 105.471 },
      "Hòa Bình": { lat: 20.813, lng: 105.338 },
      "Hưng Yên": { lat: 20.656, lng: 106.051 },
      "Khánh Hòa": { lat: 12.239, lng: 109.196 },
      "Kiên Giang": { lat: 9.958, lng: 105.132 },
      "Kon Tum": { lat: 14.354, lng: 108.007 },
      "Lai Châu": { lat: 22.396, lng: 103.456 },
      "Lâm Đồng": { lat: 11.940, lng: 108.458 },
      "Lạng Sơn": { lat: 21.853, lng: 106.761 },
      "Lào Cai": { lat: 22.486, lng: 103.975 },
      "Long An": { lat: 10.659, lng: 106.414 },
      "Nam Định": { lat: 20.420, lng: 106.168 },
      "Nghệ An": { lat: 18.679, lng: 105.681 },
      "Ninh Bình": { lat: 20.253, lng: 105.975 },
      "Ninh Thuận": { lat: 11.564, lng: 108.988 },
      "Phú Thọ": { lat: 21.308, lng: 105.313 },
      "Phú Yên": { lat: 13.088, lng: 109.293 },
      "Quảng Bình": { lat: 17.468, lng: 106.623 },
      "Quảng Nam": { lat: 15.880, lng: 108.338 },
      "Quảng Ngãi": { lat: 15.120, lng: 108.792 },
      "Quảng Ninh": { lat: 21.006, lng: 107.292 },
      "Quảng Trị": { lat: 16.747, lng: 107.192 },
      "Sóc Trăng": { lat: 9.603, lng: 105.980 },
      "Sơn La": { lat: 21.325, lng: 103.916 },
      "Tây Ninh": { lat: 11.314, lng: 106.109 },
      "Thái Bình": { lat: 20.446, lng: 106.342 },
      "Thái Nguyên": { lat: 21.594, lng: 105.848 },
      "Thanh Hóa": { lat: 19.808, lng: 105.776 },
      "Thừa Thiên Huế": { lat: 16.2, lng: 107.8 },
      "Huế": { lat: 16.2, lng: 107.8 },
      "Tiền Giang": { lat: 10.360, lng: 106.360 },
      "Trà Vinh": { lat: 9.935, lng: 106.345 },
      "Tuyên Quang": { lat: 21.818, lng: 105.218 },
      "Vĩnh Long": { lat: 10.253, lng: 105.975 },
      "Vĩnh Phúc": { lat: 21.308, lng: 105.597 },
      "Yên Bái": { lat: 21.705, lng: 104.872 },
    };
    
    // Tìm tỉnh trong danh sách
    for (const [key, coords] of Object.entries(provinceCenters)) {
      if (provinceName.includes(key)) {
        return coords;
      }
    }
    
    // Nếu không tìm thấy, dùng tọa độ mặc định (Huế)
    console.warn(`⚠️ Không tìm thấy tọa độ trung tâm cho tỉnh: ${provinceName}, dùng mặc định (Huế)`);
    return { lat: 16.2, lng: 107.8 };
  }

  /** ====== Geocode địa chỉ lấy hàng ====== */
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        if (!isAddressComplete(form.pickupAddress)) {
          setForm((s) => ({ ...s, pickupLocation: null }));
          return;
        }
        const focus = resolveFocus(form.pickupAddress);
        const r = await osmGeocode(joinAddress(form.pickupAddress), ctrl.signal, { focus });
        if (r && r.lat && r.lng) {
          setForm((s) => ({ ...s, pickupLocation: { lat: r.lat, lng: r.lng } }));
          // Cảnh báo nếu là ước tính
          if (r.isEstimated) {
            setLocationWarnings(prev => ({
              ...prev,
              pickup: `⚠️ Không tìm được địa chỉ chính xác. Đang dùng vị trí ước tính: ${r.label}`,
            }));
          } else {
            setLocationWarnings(prev => ({ ...prev, pickup: null }));
          }
        } else {
          // Fallback: dùng tọa độ trung tâm
          console.warn("Geocoding failed, using fallback");
          setForm((s) => ({ ...s, pickupLocation: focus }));
          setLocationWarnings(prev => ({
            ...prev,
            pickup: `⚠️ Không thể xác định vị trí. Đang dùng tọa độ trung tâm ${form.pickupAddress?.district?.name || form.pickupAddress?.province?.name || "khu vực"}. Khoảng cách có thể không chính xác.`,
          }));
        }
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.warn("pickup geocode error", e);
          const focus = resolveFocus(form.pickupAddress);
          setForm((s) => ({ ...s, pickupLocation: focus }));
        }
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [JSON.stringify(form.pickupAddress)]);

  /** ====== Geocode địa chỉ giao hàng ====== */
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        if (!isAddressComplete(form.deliveryAddress)) {
          setForm((s) => ({ ...s, deliveryLocation: null }));
          return;
        }
        const focus = resolveFocus(form.deliveryAddress);
        const r = await osmGeocode(joinAddress(form.deliveryAddress), ctrl.signal, { focus });
        if (r && r.lat && r.lng) {
          setForm((s) => ({ ...s, deliveryLocation: { lat: r.lat, lng: r.lng } }));
          // Cảnh báo nếu là ước tính
          if (r.isEstimated) {
            setLocationWarnings(prev => ({
              ...prev,
              delivery: `⚠️ Không tìm được địa chỉ chính xác. Đang dùng vị trí ước tính: ${r.label}`,
            }));
          } else {
            setLocationWarnings(prev => ({ ...prev, delivery: null }));
          }
        } else {
          // Fallback: dùng tọa độ trung tâm
          console.warn("Geocoding failed, using fallback");
          setForm((s) => ({ ...s, deliveryLocation: focus }));
          setLocationWarnings(prev => ({
            ...prev,
            delivery: `⚠️ Không thể xác định vị trí. Đang dùng tọa độ trung tâm ${form.deliveryAddress?.district?.name || form.deliveryAddress?.province?.name || "khu vực"}. Khoảng cách có thể không chính xác.`,
          }));
        }
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.warn("delivery geocode error", e);
          const focus = resolveFocus(form.deliveryAddress);
          setForm((s) => ({ ...s, deliveryLocation: focus }));
        }
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [JSON.stringify(form.deliveryAddress)]);

  /** ====== Khi có đủ 2 tọa độ → lấy tuyến đường bằng OSRM ====== */
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const o = form.pickupLocation,
          d = form.deliveryLocation;
        if (!o || !d) {
          setRouteGeo(null);
          setRouteSummary(null);
          return;
        }
        // Gọi OSRM trực tiếp (public server, không cần API key)
        const r = await osrmRoute(o, d, ctrl.signal);
        setRouteGeo(r?.geojson || null);
        setRouteSummary(r?.summary || null);
      } catch (e) {
        if (e?.name !== "AbortError") console.warn("OSRM route error", e);
        setRouteGeo(null);
        setRouteSummary(null);
      }
    })();
    return () => ctrl.abort();
  }, [
    form.pickupLocation?.lat,
    form.pickupLocation?.lng,
    form.deliveryLocation?.lat,
    form.deliveryLocation?.lng,
  ]);

  /** ====== Xử lý nhập liệu ====== */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  /** ====== Submit → 2 option ====== */
  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    
    if (!form.requestType) {
      setMsg("❌ Vui lòng chọn một trong hai hình thức dịch vụ");
      return;
    }

    // Validate chung
    try {
      if (!form.customerName.trim()) throw new Error("Thiếu họ tên");
      if (!isValidVNMobile(form.customerPhone)) throw new Error("SĐT không hợp lệ");
      if (!isAddressComplete(form.pickupAddress)) throw new Error("Thiếu địa chỉ LẤY HÀNG");
      if (!isAddressComplete(form.deliveryAddress)) throw new Error("Thiếu địa chỉ GIAO HÀNG");
      if (!validateMovingTime(form.movingTime)) throw new Error("Thời gian phải ở tương lai");
      if (!form.pickupLocation || !form.deliveryLocation)
        throw new Error("Không xác định được tọa độ từ địa chỉ. Vui lòng kiểm tra lại.");
    } catch (err) {
      setMsg("❌ " + err.message);
      return;
    }

    const basePayload = {
      customerName: form.customerName.trim(),
      customerPhone: normalizeVNPhone(form.customerPhone),
      pickupAddress: form.pickupAddress,
      deliveryAddress: form.deliveryAddress,
      pickupLocation: form.pickupLocation,
      deliveryLocation: form.deliveryLocation,
      pickupAddressText: joinAddress(form.pickupAddress),
      deliveryAddressText: joinAddress(form.deliveryAddress),
      movingTime: form.movingTime,
      paymentMethod: form.paymentMethod || "cash",
    };

    if (form.requestType === "SELF_SERVICE") {
      // Option 1: Tự chọn dịch vụ → chuyển sang màn thêm đồ dùng
      localStorage.setItem("pendingRequest", JSON.stringify(basePayload));
      nav("/quote/items", { state: basePayload });
    } else if (form.requestType === "STAFF_SURVEY") {
      // Option 2: Gọi staff khảo sát → tạo request với status đang đánh giá
      setLoading(true);
      try {
        const requestData = {
          ...basePayload,
          status: "UNDER_SURVEY", // Đang khảo sát
          serviceType: "STANDARD",
          notes: "Yêu cầu nhân viên khảo sát trước khi báo giá",
          surveyFee: 15000, // Phí khảo sát 15k
        };
        
        console.log("📤 [CreateRequestPage] Gửi request với data:", {
          ...requestData,
          pickupLocation: requestData.pickupLocation ? "✓" : "✗",
          deliveryLocation: requestData.deliveryLocation ? "✓" : "✗",
        });
        
        const createdRequest = await createRequest(requestData);
        
        console.log("✅ [CreateRequestPage] Nhận được response:", {
          id: createdRequest._id,
          status: createdRequest.status,
          surveyFee: createdRequest.surveyFee,
        });
        
        if (createdRequest.status !== "UNDER_SURVEY") {
          console.warn("⚠️ [CreateRequestPage] Warning: Status không đúng! Kỳ vọng: UNDER_SURVEY, Nhận được:", createdRequest.status);
        }
        
        setMsg("✅ Đã tạo yêu cầu khảo sát. Chúng tôi sẽ liên hệ bạn trong vòng 24h.");
        setTimeout(() => nav("/my-request"), 1500);
      } catch (err) {
        console.error("❌ [CreateRequestPage] Error:", err);
        setMsg("❌ " + (err.message || "Có lỗi khi tạo yêu cầu"));
      } finally {
        setLoading(false);
      }
    }
  };


  /** ====== Render ====== */
  return (
    <div className="moving-service-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1>Tạo Yêu Cầu Vận Chuyển</h1>
          <p>Điền thông tin để tạo yêu cầu vận chuyển mới</p>
        </div>

        <div className="main-card">
          {msg && (
            <div className={`message ${msg.includes("✅") ? "success" : "error"}`}>
              {msg}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-section">
              <h3>Thông tin khách hàng</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    name="customerName"
                    value={form.customerName}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    name="customerPhone"
                    value={form.customerPhone}
                    onChange={onChange}
                    placeholder="0xxxxxxxxx"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Địa chỉ lấy hàng</h3>
              <AddressPicker
                value={form.pickupAddress}
                onChange={(v) => setForm((s) => ({ ...s, pickupAddress: v }))}
              />
            </div>

            <div className="form-section">
              <h3>Địa chỉ giao hàng</h3>
              <AddressPicker
                value={form.deliveryAddress}
                onChange={(v) => setForm((s) => ({ ...s, deliveryAddress: v }))}
              />
            </div>

            <div className="form-section">
              <h3>Tuyến đường (xem trước)</h3>
              
              {/* Cảnh báo về vị trí */}
              {locationWarnings.pickup && (
                <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "#fff3cd", borderRadius: 6, fontSize: "0.9em", color: "#856404" }}>
                  📍 Lấy hàng: {locationWarnings.pickup}
                </div>
              )}
              {locationWarnings.delivery && (
                <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "#fff3cd", borderRadius: 6, fontSize: "0.9em", color: "#856404" }}>
                  🎯 Giao hàng: {locationWarnings.delivery}
                </div>
              )}
              
              <RouteMapLibre
                pickup={form.pickupLocation}
                delivery={form.deliveryLocation}
                routeGeojson={routeGeo}
                height={320}
              />
              {routeSummary ? (
                <div style={{ marginTop: "1rem", color: "#2c3e50", fontWeight: 500 }}>
                  Ước tính: <strong>{(routeSummary.distance / 1000).toFixed(1)} km</strong> •{" "}
                  <strong>{Math.round(routeSummary.duration / 60)} phút</strong>
                  {(locationWarnings.pickup || locationWarnings.delivery) && (
                    <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.85em", color: "#856404" }}>
                      ⚠️ Khoảng cách này có thể không chính xác do sử dụng vị trí ước tính
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: "1rem", color: "#7f8c8d" }}>
                  Nhập đủ địa chỉ LẤY & GIAO để hiển thị tuyến đường.
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Thời gian chuyển</h3>
              <div className="form-group">
                <label>Ngày và giờ chuyển</label>
                <input
                  type="datetime-local"
                  name="movingTime"
                  value={form.movingTime}
                  onChange={onChange}
                  min={nowForDatetimeLocal()}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Phương thức thanh toán</h3>
              <div className="radio-group">
                <label
                  className={`radio-option ${form.paymentMethod === "cash" ? "selected" : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={form.paymentMethod === "cash"}
                    onChange={(e) => setForm((s) => ({ ...s, paymentMethod: e.target.value }))}
                  />
                  <div>
                    <h4>💵 Thanh toán bằng tiền mặt</h4>
                    <p>Thanh toán khi nhân viên đến khảo sát hoặc khi nhận hàng</p>
                  </div>
                </label>
                
                <label
                  className={`radio-option ${form.paymentMethod === "online_banking" ? "selected" : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online_banking"
                    checked={form.paymentMethod === "online_banking"}
                    onChange={(e) => setForm((s) => ({ ...s, paymentMethod: e.target.value }))}
                  />
                  <div>
                    <h4>🏦 Thanh toán online (VNPay)</h4>
                    <p>Thanh toán trực tuyến qua VNPay - an toàn và tiện lợi</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Chọn hình thức dịch vụ</h3>
              <div className="radio-group">
                <label
                  className={`radio-option ${form.requestType === "SELF_SERVICE" ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value="SELF_SERVICE"
                    checked={form.requestType === "SELF_SERVICE"}
                    onChange={(e) => setForm((s) => ({ ...s, requestType: e.target.value }))}
                  />
                  <div>
                    <h4>Tự chọn dịch vụ và thêm đồ dùng</h4>
                    <p>Bạn sẽ tự chọn loại xe, nhân công và thêm đồ dùng cần vận chuyển</p>
                  </div>
                </label>
                
                <label
                  className={`radio-option ${form.requestType === "STAFF_SURVEY" ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value="STAFF_SURVEY"
                    checked={form.requestType === "STAFF_SURVEY"}
                    onChange={(e) => setForm((s) => ({ ...s, requestType: e.target.value }))}
                  />
                  <div>
                    <h4>Gọi nhân viên khảo sát nhà</h4>
                    <p>Nhân viên sẽ đến khảo sát 1 ngày trước và làm việc trực tiếp với bạn (Phí khảo sát: +15.000₫)</p>
                  </div>
                </label>
              </div>
            </div>

            <button disabled={loading} className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: "1rem" }}>
              {loading ? "Đang xử lý…" : "Tiếp tục"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
