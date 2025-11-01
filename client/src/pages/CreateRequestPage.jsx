import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isValidVNMobile, normalizeVNPhone, validateMovingTime } from "../utils/validation";
import { nowForDatetimeLocal } from "../utils/datetime";
import AddressPicker from "../components/AddressPicker";
import RouteMapLibre from "../components/RouteMapLibre";
import { osmGeocode, osrmRoute, joinAddress, isAddressComplete } from "../utils/ors";
import { createRequest } from "../api/requestApi";

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
        setForm((s) => ({ ...s, pickupLocation: r ? { lat: r.lat, lng: r.lng } : null }));
      } catch (e) {
        if (e?.name !== "AbortError") console.warn("pickup geocode error", e);
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
        setForm((s) => ({ ...s, deliveryLocation: r ? { lat: r.lat, lng: r.lng } : null }));
      } catch (e) {
        if (e?.name !== "AbortError") console.warn("delivery geocode error", e);
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
          notes: "Yêu cầu staff khảo sát trước khi báo giá",
          surveyFee: 15000, // Phí khảo sát 15k
        };
        
        const createdRequest = await createRequest(requestData);
        setMsg("✅ Đã tạo yêu cầu khảo sát. Staff sẽ liên hệ trong vòng 24h.");
        setTimeout(() => nav("/my-requests"), 1500);
      } catch (err) {
        setMsg("❌ " + (err.message || "Có lỗi khi tạo yêu cầu"));
      } finally {
        setLoading(false);
      }
    }
  };


  /** ====== Render ====== */
  return (
    <div style={{ padding: 24, display: "grid", gap: 18, maxWidth: 860 }}>
      <h1>Tạo Request</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>
          Họ và tên
          <input
            name="customerName"
            value={form.customerName}
            onChange={onChange}
            style={ipt}
          />
        </label>

        <label>
          Số điện thoại
          <input
            name="customerPhone"
            value={form.customerPhone}
            onChange={onChange}
            style={ipt}
            placeholder="0xxxxxxxxx"
          />
        </label>

        <fieldset style={fs}>
          <legend>Địa chỉ LẤY HÀNG</legend>
          <AddressPicker
            value={form.pickupAddress}
            onChange={(v) => setForm((s) => ({ ...s, pickupAddress: v }))}
          />
        </fieldset>

        <fieldset style={fs}>
          <legend>Địa chỉ GIAO HÀNG</legend>
          <AddressPicker
            value={form.deliveryAddress}
            onChange={(v) => setForm((s) => ({ ...s, deliveryAddress: v }))}
          />
        </fieldset>

        <fieldset style={fs}>
          <legend>Tuyến đường (xem trước)</legend>
          <RouteMapLibre
            pickup={form.pickupLocation}
            delivery={form.deliveryLocation}
            routeGeojson={routeGeo}
            height={320}
          />
          {routeSummary ? (
            <div style={{ marginTop: 8, color: "#444" }}>
              Ước tính: {(routeSummary.distance / 1000).toFixed(1)} km •{" "}
              {Math.round(routeSummary.duration / 60)} phút
            </div>
          ) : (
            <div style={{ marginTop: 8, color: "#666" }}>
              Nhập đủ địa chỉ LẤY & GIAO để hiển thị tuyến đường.
            </div>
          )}
        </fieldset>

        <label>
          Thời gian chuyển
          <input
            type="datetime-local"
            name="movingTime"
            value={form.movingTime}
            onChange={onChange}
            style={ipt}
            min={nowForDatetimeLocal()}
          />
        </label>

        <fieldset style={fs}>
          <legend>Chọn hình thức dịch vụ</legend>
          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="radio"
                name="requestType"
                value="SELF_SERVICE"
                checked={form.requestType === "SELF_SERVICE"}
                onChange={(e) => setForm((s) => ({ ...s, requestType: e.target.value }))}
              />
              <div>
                <strong>Tự chọn dịch vụ và thêm đồ dùng</strong>
                <div style={{ fontSize: "0.9em", color: "#666", marginTop: 4 }}>
                  Bạn sẽ tự chọn loại xe, nhân công và thêm đồ dùng cần vận chuyển
                </div>
              </div>
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="radio"
                name="requestType"
                value="STAFF_SURVEY"
                checked={form.requestType === "STAFF_SURVEY"}
                onChange={(e) => setForm((s) => ({ ...s, requestType: e.target.value }))}
              />
              <div>
                <strong>Gọi staff khảo sát nhà</strong>
                <div style={{ fontSize: "0.9em", color: "#666", marginTop: 4 }}>
                  Staff sẽ đến khảo sát 1 ngày trước và làm việc trực tiếp với bạn (Phí khảo sát: +15.000₫)
                </div>
              </div>
            </label>
          </div>
        </fieldset>

        <button disabled={loading} style={btn} type="submit">
          {loading ? "Đang xử lý…" : "Tiếp tục"}
        </button>
      </form>

      {msg && <div>{msg}</div>}
    </div>
  );
}

const ipt = { padding: 8, border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const btn = {
  padding: "10px 14px",
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
};
const removeBtn = {
  position: "absolute",
  top: -8,
  right: -8,
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "1px solid #c00",
  background: "#fff",
  color: "#c00",
  cursor: "pointer",
  lineHeight: "18px",
};
const fs = { padding: 12, border: "1px dashed #aaa", borderRadius: 8 };
