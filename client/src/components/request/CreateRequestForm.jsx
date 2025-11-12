import { useState } from "react";
import { createRequest } from "../../api/requestApi";

export default function CreateRequestForm({ onCreated }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    deliveryTime: "",
    serviceType: "Thường",
    notes: "",
  });
  const [images, setImages] = useState([]);
  const [err, setErr] = useState("");

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
      alert("Chỉ được upload tối đa 4 ảnh.");
      return;
    }
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validatePhone = (phone) => /^0\d{9}$/.test(phone);

  const validateDeliveryTime = () => {
    const dt = new Date(form.deliveryTime);
    const now = new Date();
    return dt > now;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhone(form.phone)) return setErr("SĐT không hợp lệ (bắt đầu bằng 0 và có 10 số)");
    if (!validateDeliveryTime()) return setErr("Thời gian phải nằm trong tương lai");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    images.forEach((img) => fd.append("images", img));

    try {
      await createRequest(fd);
      setForm({ name: "", phone: "", address: "", deliveryTime: "", serviceType: "Thường", notes: "" });
      setImages([]);
      onCreated?.();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="bg-red-100 text-red-700 p-2">{err}</div>}
      <div><input placeholder="Tên" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><input placeholder="Số điện thoại" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><input placeholder="Địa chỉ" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      <div><input type="datetime-local" value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} required /></div>
      <div>
        <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
          <option>Thường</option>
          <option>Hỏa tốc</option>
        </select>
      </div>
      <div><textarea placeholder="Ghi chú" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      <div>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        <div>
          {images.map((img, i) => (
            <div key={i}>
              {img.name}
              <button type="button" onClick={() => removeImage(i)}>Xóa</button>
            </div>
          ))}
        </div>
      </div>
      <button type="submit">Tạo Request</button>
    </form>
  );
}
