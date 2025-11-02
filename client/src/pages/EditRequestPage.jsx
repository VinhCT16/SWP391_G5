// client/src/pages/EditRequestPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRequest, updateRequest } from "../api/requestApi";
import { validateMovingTime, isValidVNMobile, normalizeVNPhone } from "../utils/validation";
import AddressPicker from "../components/AddressPicker";

// Convert to <input type="datetime-local"> value: "YYYY-MM-DDTHH:mm"
function toInputLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Convert GeoJSON {type:"Point",coordinates:[lng,lat]} -> {lat,lng}
function toLatLng(geo) {
  if (!geo) return null;
  if (geo.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length === 2) {
    return { lng: geo.coordinates[0], lat: geo.coordinates[1] };
  }
  if (typeof geo.lat === "number" && typeof geo.lng === "number") return geo;
  return null;
}

// Import từ ManageRequestsPage hoặc dùng chung
const getStatusLabel = (status) => {
  const statusMap = {
    PENDING_CONFIRMATION: "Đang chờ xác nhận",
    UNDER_SURVEY: "Đang khảo sát",
    WAITING_PAYMENT: "Chờ thanh toán",
    IN_PROGRESS: "Đang vận chuyển",
    DONE: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
    REJECTED: "Bị từ chối",
    // Backward compat
    PENDING_REVIEW: "Đang chờ xác nhận",
    APPROVED: "Chờ thanh toán",
  };
  return statusMap[status] || status;
};

const MAX_IMAGES = 4;

export default function EditRequestPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRequest(id);
        setForm({
          customerName: data.customerName || "",
          customerPhone: data.customerPhone || "",
          pickupAddress: data.pickupAddress || data.address || { province: null, district: null, ward: null, street: "" },
          pickupLocation: toLatLng(data.pickupLocation || data.location) || { lat: 21.0278, lng: 105.8342 },
          deliveryAddress: data.deliveryAddress || data.address || { province: null, district: null, ward: null, street: "" },
          deliveryLocation: toLatLng(data.deliveryLocation || data.location) || { lat: 21.0278, lng: 105.8342 },
          movingTime: toInputLocal(data.movingTime),
          status: data.status
        });
      } catch (e) {
        setMsg("Không tải được request");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form) return;
    setMsg(""); setSaving(true);
    try {
      if (!["PENDING_CONFIRMATION", "PENDING_REVIEW"].includes(form.status)) {
        throw new Error("Chỉ sửa khi đang chờ xác nhận");
      }
      if (!form.customerName.trim()) throw new Error("Thiếu họ tên");
      if (!isValidVNMobile(form.customerPhone)) throw new Error("SĐT không hợp lệ");
      if (!validateMovingTime(form.movingTime)) throw new Error("Thời gian phải ở tương lai");

      const payload = {
        customerName: form.customerName,
        customerPhone: normalizeVNPhone(form.customerPhone),
        pickupAddress: form.pickupAddress,
        pickupLocation: { type: "Point", coordinates: [form.pickupLocation.lng, form.pickupLocation.lat] },
        deliveryAddress: form.deliveryAddress,
        deliveryLocation: { type: "Point", coordinates: [form.deliveryLocation.lng, form.deliveryLocation.lat] },
        movingTime: new Date(form.movingTime)
      };

      await updateRequest(id, payload);
      setMsg("✅ Lưu thay đổi thành công");
      setTimeout(() => nav("/my-requests"), 600);
    } catch (err) {
      setMsg("❌ " + (err.message || "Có lỗi khi lưu"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <div style={{ padding: 24 }}>Đang tải…</div>;

  return (
    <div style={{ padding: 24, display: "grid", gap: 18, maxWidth: 860 }}>
      <h1>Sửa Request</h1>
      <div>Trạng thái: <b>{getStatusLabel(form.status)}</b></div>

      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>Họ và tên
          <input
            name="customerName"
            value={form.customerName}
            onChange={(e)=>setForm((s)=>({ ...s, customerName: e.target.value }))}
            style={ipt}
          />
        </label>

        <label>Số điện thoại
          <input
            name="customerPhone"
            value={form.customerPhone}
            onChange={(e)=>setForm((s)=>({ ...s, customerPhone: e.target.value }))}
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

        <label>Thời gian chuyển
          <input
            type="datetime-local"
            name="movingTime"
            value={form.movingTime}
            onChange={(e) => setForm((s)=>({ ...s, movingTime: e.target.value }))}
            style={ipt}
            min={new Date().toISOString().slice(0, 16)}
          />
        </label>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button onClick={() => nav("/my-requests")} style={{ ...btn, background: "#999", flex: 1 }}>
            Quay lại
          </button>
          <button disabled={saving} type="submit" style={{ ...btn, flex: 1 }}>
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      {msg && <div>{msg}</div>}
    </div>
  );
}

const ipt = { padding: 8, border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const btn = { padding: "10px 14px", border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 8 };
const fs  = { padding: 12, border: "1px dashed #aaa", borderRadius: 8 };
