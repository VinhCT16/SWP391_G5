import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fileToBase64 } from "../utils/toBase64";
import { isValidVNMobile, normalizeVNPhone, validateMovingTime } from "../utils/validation";
import { nowForDatetimeLocal } from "../utils/datetime";
import AddressPicker from "../components/AddressPicker";
import RouteMapLibre from "../components/RouteMapLibre";
import { orsGeocode, joinAddress, isAddressComplete } from "../utils/ors";
import { estimateQuote } from "../api/quoteApi";

const MAX_IMAGES = 4;
const MAX_FILE_MB = 1.5;

export default function CreateRequestPage() {
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    pickupAddress: { province: null, district: null, ward: null, street: "" },
    pickupLocation: null,
    deliveryAddress: { province: null, district: null, ward: null, street: "" },
    deliveryLocation: null,
    movingTime: "",
    serviceType: "STANDARD",
    notes: "",
    images: [],
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
        const r = await orsGeocode(joinAddress(form.pickupAddress), ctrl.signal, { focus });
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
        const r = await orsGeocode(joinAddress(form.deliveryAddress), ctrl.signal, { focus });
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

  /** ====== Khi có đủ 2 tọa độ → lấy tuyến đường ====== */
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
        // gọi backend để tránh CORS và lấy route chính xác từ server
        const r = await estimateQuote({ pickupLocation: o, deliveryLocation: d });
        setRouteGeo(r?.routeGeojson || null);
        setRouteSummary(r?.distanceKm && r?.durationMin ? { distance: r.distanceKm * 1000, duration: r.durationMin * 60 } : null);
      } catch (e) {
        if (e?.name !== "AbortError") console.warn("directions error", e);
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

  /** ====== Upload ảnh ====== */
  const addFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;
    const remain = MAX_IMAGES - form.images.length;
    if (remain <= 0) {
      setMsg(`Bạn chỉ được thêm tối đa ${MAX_IMAGES} ảnh.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const arr = [];
    for (const f of files.slice(0, remain)) {
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_MB) {
        setMsg(`Ảnh ${f.name} vượt ${MAX_FILE_MB}MB`);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      arr.push(await fileToBase64(f));
    }
    setForm((s) => ({ ...s, images: s.images.concat(arr) }));
    if (fileRef.current) fileRef.current.value = "";
  };

  /** ====== Submit → chuyển sang màn báo giá ====== */

const submit = async (e) => {
  e.preventDefault();
  setMsg("");
  setLoading(true);
  try {
    if (!form.customerName.trim()) throw new Error("Thiếu họ tên");
    if (!isValidVNMobile(form.customerPhone)) throw new Error("SĐT không hợp lệ");
    if (!isAddressComplete(form.pickupAddress)) throw new Error("Thiếu địa chỉ LẤY HÀNG");
    if (!isAddressComplete(form.deliveryAddress)) throw new Error("Thiếu địa chỉ GIAO HÀNG");
    if (!validateMovingTime(form.movingTime)) throw new Error("Thời gian phải ở tương lai");
    if (!form.pickupLocation || !form.deliveryLocation)
      throw new Error("Không xác định được tọa độ từ địa chỉ. Vui lòng kiểm tra lại.");

    // ✅ Tạo payload chuẩn để truyền sang QuotePage
    const payload = {
      customerName: form.customerName.trim(),
      customerPhone: normalizeVNPhone(form.customerPhone),
      pickupAddress: form.pickupAddress,
      deliveryAddress: form.deliveryAddress,
      pickupLocation: form.pickupLocation,
      deliveryLocation: form.deliveryLocation,
      pickupAddressText: joinAddress(form.pickupAddress),
      deliveryAddressText: joinAddress(form.deliveryAddress),
      movingTime: form.movingTime,
      serviceType: form.serviceType,
      notes: form.notes,
      images: form.images,
    };

    // ✅ Lưu tạm vào localStorage (phòng reload)
    localStorage.setItem("pendingRequest", JSON.stringify(payload));

    // ✅ Điều hướng sang trang báo giá
    setMsg("➡️ Đang chuyển sang màn Báo giá…");
    setTimeout(() => nav("/quote", { state: payload }), 500);
  } catch (err) {
    setMsg("❌ " + (err.message || "Có lỗi xảy ra"));
  } finally {
    setLoading(false);
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

        <label>
          Dịch vụ
          <select
            name="serviceType"
            value={form.serviceType}
            onChange={onChange}
            style={ipt}
          >
            <option value="STANDARD">Thường</option>
            <option value="EXPRESS">Hoả tốc</option>
          </select>
        </label>

        <label>
          Ghi chú
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            rows={3}
            style={ipt}
          />
        </label>

        <div style={{ display: "grid", gap: 8 }}>
          <div>Ảnh (tối đa {MAX_IMAGES})</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => addFiles(e.target.files)}
          />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {form.images.map((b64, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img
                  src={b64}
                  alt="preview"
                  style={{
                    width: 120,
                    height: 90,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((s) => ({
                      ...s,
                      images: s.images.filter((_, i) => i !== idx),
                    }))
                  }
                  style={removeBtn}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button disabled={loading} style={btn}>
          {loading ? "Đang chuyển…" : "Tiếp tục báo giá"}
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
