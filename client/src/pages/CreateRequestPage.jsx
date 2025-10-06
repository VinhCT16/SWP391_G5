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
    address: { province: null, district: null, ward: null, street: "" },
    location: { lat: 21.0278, lng: 105.8342 }, // default Hà Nội
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

    const valid = [];
    for (const f of files.slice(0, remain)) {
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_FILE_MB) {
        setMsg(`❌ Ảnh "${f.name}" quá lớn (> ${MAX_FILE_MB}MB).`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const arr = await Promise.all(valid.map(fileToBase64));
    setForm((s) => ({ ...s, images: [...s.images, ...arr] }));
    if (fileRef.current) fileRef.current.value = ""; // reset để chọn lại cùng file tên cũ
  };

  const removeImageAt = (idx) => {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== idx) }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    // Validate phone
    if (!isValidVNMobile(form.customerPhone)) {
      setMsg("❌ Số điện thoại không đúng định dạng VN (0(3/5/7/8/9) + 8 số).");
      return;
    }

    // Validate address
    if (!isAddressComplete(form.address)) {
      setMsg("❌ Vui lòng chọn đủ Tỉnh/TP, Quận/Huyện, Phường/Xã và nhập Số nhà/Đường.");
      return;
    }

    // Validate moving time (tương lai + quy tắc 12h)
    const vt = validateMovingTime(form.movingTime);
    if (!vt.ok) {
      setMsg("❌ " + vt.msg);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerName: form.customerName,
        customerPhone: normalizeVNPhone(form.customerPhone),
        address: form.address,
        location: { type: "Point", coordinates: [form.location.lng, form.location.lat] },
        movingTime: new Date(form.movingTime),
        serviceType: form.serviceType,
        notes: form.notes,
        images: form.images, // base64 (demo)
      };

      await createRequest(payload);

      // lưu phone để lọc ở màn Manage
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
    <div style={{ padding: 24, display: "grid", gap: 18, maxWidth: 820 }}>
      <h1>Tạo Request</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>Họ và tên
          <input name="customerName" value={form.customerName} onChange={onChange} required style={ipt}/>
        </label>

        <label>Số điện thoại
          <input name="customerPhone" value={form.customerPhone} onChange={onChange} required style={ipt} placeholder="+84"/>
        </label>

        <div>
          <h3 style={{ margin: "8px 0" }}>Địa chỉ</h3>
          <AddressPicker
            value={form.address}
            onChange={(addr) => setForm((s) => ({ ...s, address: addr }))}
          />
        </div>

        <div>
          <h3 style={{ margin: "8px 0" }}>Vị trí trên bản đồ</h3>
          <MapPicker
            value={form.location}
            onChange={(loc) => setForm((s) => ({ ...s, location: loc }))}
          />
        </div>

        <label>Thời gian chuyển nhà
          <input
            type="datetime-local"
            name="movingTime"
            value={form.movingTime}
            onChange={onChange}
            required
            min={nowForDatetimeLocal()}
            style={ipt}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            {form.movingTime ? `Hiển thị: ${fmtDateTime24(form.movingTime)}` : ""}
          </div>
        </label>

        <label>Dịch vụ
          <select name="serviceType" value={form.serviceType} onChange={onChange} style={ipt}>
            <option value="STANDARD">Thường</option>
            <option value="EXPRESS">Hỏa tốc</option>
          </select>
        </label>

        <label>Ảnh (tối đa 4, ≤ {MAX_FILE_MB}MB/ảnh)
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} />
        </label>

        {form.images.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {form.images.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={src} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}/>
                <button type="button" onClick={() => removeImageAt(i)} title="Xóa ảnh" style={removeBtn}>×</button>
              </div>
            ))}
          </div>
        )}

        <label>Ghi chú
          <textarea name="notes" rows={3} value={form.notes} onChange={onChange} style={ipt}/>
        </label>

        <button disabled={loading} style={btn}>
          {loading ? "Đang gửi..." : "Gửi Request (Chờ duyệt)"}
        </button>
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
