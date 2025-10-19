import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../api/requestApi";
import { fileToBase64 } from "../utils/toBase64";
import { isValidVNMobile, normalizeVNPhone, validateMovingTime } from "../utils/validation";
import { fmtDateTime24, nowForDatetimeLocal } from "../utils/datetime";
import AddressPicker from "../components/AddressPicker";
import MapPicker from "../components/MapPicker";

const MAX_IMAGES = 4;
const MAX_FILE_MB = 1.5;

function isAddressComplete(a) {
  return !!(
    a?.province?.code &&
    a?.district?.code &&
    a?.ward?.code &&
    String(a?.street || "").trim()
  );
}

export default function CreateRequestPage() {
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    pickupAddress: { province: null, district: null, ward: null, street: "" },
    pickupLocation: { lat: 21.0278, lng: 105.8342 }, // Hà Nội
    deliveryAddress: { province: null, district: null, ward: null, street: "" },
    deliveryLocation: { lat: 21.0278, lng: 105.8342 },
    movingTime: "",
    serviceType: "STANDARD",
    notes: "",
    images: [],
  });
  const [msg, setMsg] = useState(""); 
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

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

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setLoading(true);
    try {
      if (!form.customerName.trim()) throw new Error("Thiếu họ tên");
      if (!isValidVNMobile(form.customerPhone)) throw new Error("SĐT không hợp lệ");
      if (!isAddressComplete(form.pickupAddress)) throw new Error("Thiếu địa chỉ LẤY HÀNG");
      if (!isAddressComplete(form.deliveryAddress)) throw new Error("Thiếu địa chỉ GIAO HÀNG");
      if (!validateMovingTime(form.movingTime)) throw new Error("Thời gian phải ở tương lai");

      const payload = {
        customerName: form.customerName,
        customerPhone: normalizeVNPhone(form.customerPhone),
        pickupAddress: form.pickupAddress,
        pickupLocation: { type: "Point", coordinates: [form.pickupLocation.lng, form.pickupLocation.lat] },
        deliveryAddress: form.deliveryAddress,
        deliveryLocation: { type: "Point", coordinates: [form.deliveryLocation.lng, form.deliveryLocation.lat] },
        movingTime: new Date(form.movingTime),
        serviceType: form.serviceType,
        notes: form.notes,
        images: form.images,
      };

      await createRequest(payload);

      localStorage.setItem("my_phone", normalizeVNPhone(form.customerPhone));
      setMsg("✅ Tạo request thành công. Đang chuyển tới trang quản lý…");
      setTimeout(() => nav("/my-requests"), 700);
    } catch (err) {
      setMsg("❌ " + (err.message || "Có lỗi xảy ra khi tạo request"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 18, maxWidth: 860 }}>
      <h1>Tạo Request</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>Họ và tên
          <input name="customerName" value={form.customerName} onChange={onChange} style={ipt} />
        </label>

        <label>Số điện thoại
          <input name="customerPhone" value={form.customerPhone} onChange={onChange} style={ipt} placeholder="0xxxxxxxxx" />
        </label>

        <fieldset style={fs}>
          <legend>Địa chỉ LẤY HÀNG</legend>
          <AddressPicker
            value={form.pickupAddress}
            onChange={(v) => setForm((s) => ({ ...s, pickupAddress: v }))}
          />
          <MapPicker
            value={form.pickupLocation}
            onChange={(v) => setForm((s) => ({ ...s, pickupLocation: v }))}
          />
        </fieldset>

        <fieldset style={fs}>
          <legend>Địa chỉ GIAO HÀNG</legend>
          <AddressPicker
            value={form.deliveryAddress}
            onChange={(v) => setForm((s) => ({ ...s, deliveryAddress: v }))}
          />
          <MapPicker
            value={form.deliveryLocation}
            onChange={(v) => setForm((s) => ({ ...s, deliveryLocation: v }))}
          />
        </fieldset>

        <label>Thời gian chuyển
          <input type="datetime-local" name="movingTime" value={form.movingTime} onChange={onChange} style={ipt} min={nowForDatetimeLocal()} />
        </label>

        <label>Dịch vụ
          <select name="serviceType" value={form.serviceType} onChange={onChange} style={ipt}>
            <option value="STANDARD">Thường</option>
            <option value="EXPRESS">Hoả tốc</option>
          </select>
        </label>

        <label>Ghi chú
          <textarea name="notes" value={form.notes} onChange={onChange} rows={3} style={ipt} />
        </label>

        <div style={{ display: "grid", gap: 8 }}>
          <div>Ảnh (tối đa {MAX_IMAGES})</div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {form.images.map((b64, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img src={b64} alt="preview" style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }} />
                <button type="button" onClick={() => setForm((s) => ({ ...s, images: s.images.filter((_,i)=>i!==idx) }))} style={removeBtn}>×</button>
              </div>
            ))}
          </div>
        </div>

        <button disabled={loading} style={btn}>{loading ? "Đang tạo…" : "Tạo Request"}</button>
      </form>

      {msg && <div>{msg}</div>}
    </div>
  );
}

const ipt = { padding: 8, border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const btn = { padding: "10px 14px", border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 8 };
const removeBtn = {
  position: "absolute", top: -8, right: -8, width: 22, height: 22,
  borderRadius: "50%", border: "1px solid #c00", background: "#fff", color: "#c00", cursor: "pointer", lineHeight: "18px"
};
const fs = { padding: 12, border: "1px dashed #aaa", borderRadius: 8 };
