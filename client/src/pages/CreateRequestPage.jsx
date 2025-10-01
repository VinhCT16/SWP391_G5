import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../api/requestApi";
import { fileToBase64 } from "../utils/toBase64";
import { isValidVNMobile, normalizeVNPhone, validateMovingTime } from "../utils/validation";
import { fmtDateTime24, nowForDatetimeLocal } from "../utils/datetime";

const MAX_IMAGES = 4;
const MAX_FILE_MB = 1.5;

export default function CreateRequestPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
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

    // chặn quá 4 ảnh
    const remain = MAX_IMAGES - form.images.length;
    if (remain <= 0) {
      setMsg(`Bạn chỉ được thêm tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    // kiểm tra dung lượng
    const valid = [];
    for (const f of files.slice(0, remain)) {
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_FILE_MB) {
        setMsg(`❌ Ảnh "${f.name}" quá lớn (> ${MAX_FILE_MB}MB).`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) return;

    const arr = await Promise.all(valid.map(fileToBase64));
    setForm((s) => ({ ...s, images: [...s.images, ...arr] }));
  };

  const removeImageAt = (idx) => {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== idx) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    // phone
    if (!isValidVNMobile(form.customerPhone)) {
      setMsg("❌ Số điện thoại không đúng định dạng VN.");
      return;
    }

    // moving time
    const vt = validateMovingTime(form.movingTime);
    if (!vt.ok) {
      setMsg("❌ " + vt.msg);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        customerPhone: normalizeVNPhone(form.customerPhone),
        movingTime: new Date(form.movingTime),
      };
      await createRequest(payload);

      // chỉ lưu phone để lọc ở màn Manage — KHÔNG làm thay đổi dữ liệu cũ
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
    <div style={{ padding: 24, display: "grid", gap: 18, maxWidth: 720 }}>
      <h1>Tạo Request</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>Họ tên
          <input name="customerName" value={form.customerName} onChange={onChange} required style={ipt}/>
        </label>

        <label>Số điện thoại (VN)
          <input name="customerPhone" value={form.customerPhone} onChange={onChange} required style={ipt} placeholder="09xxxxxxxx / +849xxxxxxxx"/>
        </label>

        <label>Địa chỉ
          <input name="address" value={form.address} onChange={onChange} required style={ipt}/>
        </label>

        <label>Thời gian chuyển nhà
  <input
    type="datetime-local"
    name="movingTime"
    value={form.movingTime}
    onChange={onChange}
    required
    min={nowForDatetimeLocal()}          // ⬅ chặn chọn quá khứ (mức input)
    style={ipt}
  />
    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
    {form.movingTime ? `Hiển thị: ${fmtDateTime24(form.movingTime)}` : "định dạng: dd/MM/yyyy, HH:mm"}
  </div>
</label>

        <label>Dịch vụ
          <select name="serviceType" value={form.serviceType} onChange={onChange} style={ipt}>
            <option value="STANDARD">Thường</option>
            <option value="EXPRESS">Hỏa tốc</option>
          </select>
        </label>

        <label>Ảnh (tối đa 4, ≤ {MAX_FILE_MB}MB/ảnh)
          <input type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} />
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
