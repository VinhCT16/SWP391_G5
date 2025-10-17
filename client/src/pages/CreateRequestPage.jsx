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
  return !!(a?.province?.code && a?.district?.code && a?.ward?.code && String(a?.street || "").trim());
}

export default function CreateRequestPage() {
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    pickupAddress:   { province: null, district: null, ward: null, street: "" },
    pickupLocation:  { lat: 21.0278, lng: 105.8342 },
    deliveryAddress: { province: null, district: null, ward: null, street: "" },
    deliveryLocation:{ lat: 21.0278, lng: 105.8342 },
    movingTime: "",
    serviceType: "STANDARD",
    notes: "",
    images: [],
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const addFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;
    const remain = MAX_IMAGES - form.images.length;
    if (remain <= 0) { setMsg(`Bạn chỉ được thêm tối đa ${MAX_IMAGES} ảnh.`); fileRef.current && (fileRef.current.value=""); return; }

    const valid = [];
    for (const f of files.slice(0, remain)) {
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_FILE_MB) { setMsg(`❌ Ảnh "${f.name}" quá lớn (> ${MAX_FILE_MB}MB).`); continue; }
      valid.push(f);
    }
    if (!valid.length) { fileRef.current && (fileRef.current.value=""); return; }

    const arr = await Promise.all(valid.map(fileToBase64));
    setForm((s) => ({ ...s, images: [...s.images, ...arr] }));
    fileRef.current && (fileRef.current.value="");
  };

  const removeImageAt = (idx) => {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== idx) }));
    fileRef.current && (fileRef.current.value="");
  };

  const submit = async (e) => {
    e.preventDefault(); setMsg("");

    if (!isValidVNMobile(form.customerPhone)) return setMsg("❌ Số điện thoại không đúng định dạng.");
    if (!isAddressComplete(form.pickupAddress)) return setMsg("❌ Vui lòng nhập đủ địa chỉ LẤY HÀNG.");
    if (!isAddressComplete(form.deliveryAddress)) return setMsg("❌ Vui lòng nhập đủ địa chỉ GIAO HÀNG.");

    const vt = validateMovingTime(form.movingTime);
    if (!vt.ok) return setMsg("❌ " + vt.msg);

    try {
      setLoading(true);
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
      setMsg("✅ Tạo request thành công!"); setTimeout(()=>nav("/my-requests"), 700);
    } catch (err) {
      setMsg("❌ " + (err.message || "Có lỗi xảy ra khi tạo request"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 18, maxWidth: 920 }}>
      <h1>Tạo Request</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>Họ và tên
          <input name="customerName" value={form.customerName} onChange={onChange} required style={ipt}/>
        </label>
        <label>Số điện thoại
          <input name="customerPhone" value={form.customerPhone} onChange={onChange} required style={ipt}/>
        </label>

        <div style={card}>
          <h3>Địa chỉ LẤY HÀNG</h3>
          <AddressPicker value={form.pickupAddress} onChange={(addr)=>setForm(s=>({ ...s, pickupAddress: addr }))}/>
          <h4>Vị trí</h4>
          <MapPicker value={form.pickupLocation} onChange={(loc)=>setForm(s=>({ ...s, pickupLocation: loc }))}/>
        </div>

        <div style={card}>
          <h3>Địa chỉ GIAO HÀNG</h3>
          <AddressPicker value={form.deliveryAddress} onChange={(addr)=>setForm(s=>({ ...s, deliveryAddress: addr }))}/>
          <h4>Vị trí</h4>
          <MapPicker value={form.deliveryLocation} onChange={(loc)=>setForm(s=>({ ...s, deliveryLocation: loc }))}/>
        </div>

        <label>Thời gian chuyển nhà
          <input type="datetime-local" name="movingTime" value={form.movingTime} onChange={onChange} required min={nowForDatetimeLocal()} style={ipt}/>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            {form.movingTime && `Hiển thị: ${fmtDateTime24(form.movingTime)}`}
          </div>
        </label>

        <label>Dịch vụ
          <select name="serviceType" value={form.serviceType} onChange={onChange} style={ipt}>
            <option value="STANDARD">Thường</option>
            <option value="EXPRESS">Hỏa tốc</option>
          </select>
        </label>

        <label>Ảnh (tối đa 4, ≤ {MAX_FILE_MB}MB/ảnh)
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e)=>addFiles(e.target.files)}/>
        </label>

        {form.images.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {form.images.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={src} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}/>
                <button type="button" onClick={()=>removeImageAt(i)} style={removeBtn}>×</button>
              </div>
            ))}
          </div>
        )}

        <label>Ghi chú
          <textarea name="notes" rows={3} value={form.notes} onChange={onChange} style={ipt}/>
        </label>

        <button disabled={loading} style={btn}>{loading ? "Đang gửi..." : "Gửi Request (Chờ duyệt)"}</button>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  );
}

const ipt = { padding: 8, border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const btn = { padding: "10px 14px", border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 8 };
const removeBtn = { position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", border: "1px solid #c00", background: "#fff", color: "#c00", cursor: "pointer", lineHeight: "18px" };
const card = { padding: 12, border: "1px solid #e5e5e5", borderRadius: 8 };
