import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRequest, updateRequest } from "../api/requestApi";
import { fileToBase64 } from "../utils/toBase64";
import { validateMovingTime } from "../utils/validation";
import { fmtDateTime24, nowForDatetimeLocal } from "../utils/datetime";
import AddressPicker from "../components/AddressPicker";
import MapPicker from "../components/MapPicker";
import { formatAddress } from "../utils/format";

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

export default function EditRequestPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await getRequest(id);
      // location: GeoJSON -> {lat,lng}
      const lat = r?.location?.coordinates?.[1];
      const lng = r?.location?.coordinates?.[0];
      setForm({
        id: r._id,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        address: r.address || { province: null, district: null, ward: null, street: "" },
        location: (typeof lat === "number" && typeof lng === "number") ? { lat, lng } : { lat: 21.0278, lng: 105.8342 },
        movingTime: r.movingTime ? r.movingTime.slice(0, 16) : "",
        serviceType: r.serviceType,
        notes: r.notes || "",
        images: r.images || [],
        status: r.status,
      });
    })();
  }, [id]);

  if (!form) return <div style={{ padding: 24 }}>Đang tải…</div>;

  const disabled = form.status !== "PENDING_REVIEW";

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const addFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    const remain = MAX_IMAGES - (form.images?.length || 0);
    if (remain <= 0) { setMsg(`Tối đa ${MAX_IMAGES} ảnh.`); if (fileRef.current) fileRef.current.value = ""; return; }

    const valid = [];
    for (const f of files.slice(0, remain)) {
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_FILE_MB) {
        setMsg(`❌ Ảnh "${f.name}" quá lớn (> ${MAX_FILE_MB}MB).`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) { if (fileRef.current) fileRef.current.value = ""; return; }

    const arr = await Promise.all(valid.map(fileToBase64));
    setForm((s) => ({ ...s, images: [...(s.images || []), ...arr] }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImageAt = (idx) => {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== idx) }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (disabled) {
      setMsg("Không thể chỉnh sửa vì request đã qua bước duyệt.");
      return;
    }

    // Validate address
    if (!isAddressComplete(form.address)) {
      setMsg("❌ Vui lòng chọn đủ Tỉnh/TP, Quận/Huyện, Phường/Xã và nhập Số nhà/Đường.");
      return;
    }

    // Validate moving time
    const vt = validateMovingTime(form.movingTime);
    if (!vt.ok) {
      setMsg("❌ " + vt.msg);
      return;
    }

    try {
      setLoading(true);
      await updateRequest(form.id, {
        address: form.address,
        location: { type: "Point", coordinates: [form.location.lng, form.location.lat] },
        movingTime: new Date(form.movingTime),
        serviceType: form.serviceType,
        images: form.images,
        notes: form.notes,
      });
      setMsg("✅ Cập nhật thành công");
      setTimeout(() => nav("/my-requests"), 600);
    } catch (err) {
      setMsg("❌ " + (err.message || "Không thể cập nhật"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 12, maxWidth: 820 }}>
      <h1>Chỉnh sửa Request</h1>
      <div style={{ color: "#888" }}>Trạng thái: <b>{form.status}</b></div>
      {disabled && <div style={{ color: "#c00" }}>Chỉ chỉnh sửa khi <b>Đang chờ duyệt</b>.</div>}

      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>Họ tên (không sửa)
          <input value={form.customerName} disabled style={ipt}/>
        </label>

        <label>Số điện thoại (không sửa)
          <input value={form.customerPhone} disabled style={ipt}/>
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
            disabled={disabled}
            min={nowForDatetimeLocal()}
            style={ipt}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            {form.movingTime ? `Hiển thị: ${fmtDateTime24(form.movingTime)}` : "định dạng: dd/MM/yyyy, HH:mm"}
          </div>
        </label>

        <label>Dịch vụ
          <select name="serviceType" value={form.serviceType} onChange={onChange} disabled={disabled} style={ipt}>
            <option value="STANDARD">Thường</option>
            <option value="EXPRESS">Hỏa tốc</option>
          </select>
        </label>

        <label>Ảnh (tối đa 4, ≤ {MAX_FILE_MB}MB/ảnh)
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} disabled={disabled}/>
        </label>

        {!!form.images?.length && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {form.images.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={src} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}/>
                {!disabled && (
                  <button type="button" onClick={() => removeImageAt(i)} title="Xóa ảnh" style={removeBtn}>×</button>
                )}
              </div>
            ))}
          </div>
        )}

        <label>Ghi chú
          <textarea name="notes" rows={3} value={form.notes} onChange={onChange} disabled={disabled} style={ipt}/>
        </label>

        <button disabled={disabled || loading} style={btn}>
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
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
