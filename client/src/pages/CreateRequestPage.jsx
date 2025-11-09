import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isValidVNMobile, normalizeVNPhone, validateMovingTime } from "../utils/validation";
import { nowForDatetimeLocal } from "../utils/datetime";
import AddressPicker from "../components/AddressPicker";
import RouteMapLibre from "../components/RouteMapLibre";
import { osmGeocode, osrmRoute, joinAddress, isAddressComplete } from "../utils/ors";
import { createRequest } from "../api/requestApi";
import "../styles/movingService.css";

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
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Route preview state
  const [routeGeo, setRouteGeo] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);

  /** ====== Xác định toạ độ trung tâm bias theo tỉnh ====== */
  function resolveFocus(addr) {
    const name = addr?.province?.name || "";
    if (name.includes("Hà Nội")) return { lat: 21.028, lng: 105.854 };
    if (name.includes("Hồ Chí Minh") || name.includes("HCM")) return { lat: 10.77, lng: 106.69 };
    if (name.includes("Đà Nẵng")) return { lat: 16.054, lng: 108.202 };
    if (name.includes("Hải Phòng")) return { lat: 20.864, lng: 106.683 };
    if (name.includes("Cần Thơ")) return { lat: 10.045, lng: 105.746 };
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
        } else {
          // Fallback: dùng tọa độ trung tâm
          console.warn("Geocoding failed, using fallback");
          setForm((s) => ({ ...s, pickupLocation: focus }));
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
        } else {
          // Fallback: dùng tọa độ trung tâm
          console.warn("Geocoding failed, using fallback");
          setForm((s) => ({ ...s, deliveryLocation: focus }));
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
        setTimeout(() => nav("/my-requests"), 1500);
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
