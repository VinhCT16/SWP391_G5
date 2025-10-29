// client/src/pages/QuotePage.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { estimateQuote } from "../api/quoteApi";
import { fileToBase64 } from "../utils/toBase64";

export default function QuotePage() {
  const { state } = useLocation(); // nhận data từ CreateRequestPage
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({
    serviceType: "STANDARD",
    vehicleType: "1T",
    helpers: 0,
    extras: [],
  });
  const [quote, setQuote] = useState(null);
  const [msg, setMsg] = useState("");

  const addItem = () =>
    setItems((s) => [...s, { name: "", weight: "", l: "", w: "", h: "", images: [] }]);

  const updateItem = (idx, field, val) => {
    setItems((s) => s.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  };

  const addImages = async (idx, files) => {
    const arr = [];
    for (const f of Array.from(files).slice(0, 4)) arr.push(await fileToBase64(f));
    setItems((s) =>
      s.map((it, i) => (i === idx ? { ...it, images: [...it.images, ...arr] } : it))
    );
  };

  const calc = async () => {
    setMsg("");
    try {
      const payload = {
        pickupLocation: state?.pickupLocation,
        deliveryLocation: state?.deliveryLocation,
        serviceType: options.serviceType,
        vehicleType: options.vehicleType,
        helpers: Number(options.helpers),
        extras: options.extras,
      };
      const r = await estimateQuote(payload);
      setQuote(r);
    } catch (e) {
      setMsg("❌ Không thể tính giá, vui lòng thử lại.");
    }
  };

  const toggleExtra = (key) =>
    setOptions((s) => ({
      ...s,
      extras: s.extras.includes(key)
        ? s.extras.filter((x) => x !== key)
        : [...s.extras, key],
    }));

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <h1>Báo giá</h1>

      {/* Thông tin địa chỉ */}
      <fieldset style={fs}>
        <legend>Thông tin địa chỉ</legend>
        <div>
          <b>Lấy hàng:</b> {state?.pickupAddressText || "—"}
        </div>
        <div>
          <b>Giao hàng:</b> {state?.deliveryAddressText || "—"}
        </div>
      </fieldset>

      {/* Đồ dùng */}
      <fieldset style={fs}>
        <legend>Đồ dùng cần vận chuyển</legend>
        {items.map((it, idx) => (
          <div key={idx} style={itemBox}>
            <input
              placeholder="Tên đồ"
              value={it.name}
              onChange={(e) => updateItem(idx, "name", e.target.value)}
              style={ipt}
            />
            <input
              placeholder="Cân nặng (kg)"
              value={it.weight}
              onChange={(e) => updateItem(idx, "weight", e.target.value)}
              style={ipt}
            />
            <input
              placeholder="Dài (cm)"
              value={it.l}
              onChange={(e) => updateItem(idx, "l", e.target.value)}
              style={ipt}
            />
            <input
              placeholder="Rộng (cm)"
              value={it.w}
              onChange={(e) => updateItem(idx, "w", e.target.value)}
              style={ipt}
            />
            <input
              placeholder="Cao (cm)"
              value={it.h}
              onChange={(e) => updateItem(idx, "h", e.target.value)}
              style={ipt}
            />
            <input type="file" multiple accept="image/*" onChange={(e) => addImages(idx, e.target.files)} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {it.images.map((src, i2) => (
                <img key={i2} src={src} alt="" style={{ width: 60, height: 60, objectFit: "cover" }} />
              ))}
            </div>
          </div>
        ))}
        <button onClick={addItem}>+ Thêm đồ dùng</button>
      </fieldset>

      {/* Tùy chọn dịch vụ */}
      <fieldset style={fs}>
        <legend>Tùy chọn dịch vụ</legend>
        <div>
          Dịch vụ:
          <select
            value={options.serviceType}
            onChange={(e) => setOptions((s) => ({ ...s, serviceType: e.target.value }))}
          >
            <option value="STANDARD">Thường</option>
            <option value="EXPRESS">Hỏa tốc</option>
          </select>
          Loại xe:
          <select
            value={options.vehicleType}
            onChange={(e) => setOptions((s) => ({ ...s, vehicleType: e.target.value }))}
          >
            <option value="0.5T">0.5 tấn</option>
            <option value="1T">1 tấn</option>
            <option value="1.25T">1.25 tấn</option>
            <option value="2T">2 tấn</option>
            <option value="3.5T">3.5 tấn</option>
          </select>
          Nhân công:
          <select
            value={options.helpers}
            onChange={(e) => setOptions((s) => ({ ...s, helpers: e.target.value }))}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 8 }}>
          <label>
            <input type="checkbox" onChange={() => toggleExtra("wrap")} checked={options.extras.includes("wrap")} />{" "}
            Bọc hàng kỹ
          </label>
          <label>
            <input
              type="checkbox"
              onChange={() => toggleExtra("disassemble")}
              checked={options.extras.includes("disassemble")}
            />{" "}
            Tháo/lắp nội thất
          </label>
          <label>
            <input type="checkbox" onChange={() => toggleExtra("climb")} checked={options.extras.includes("climb")} />{" "}
            Khuân vác tầng cao
          </label>
          <label>
            <input type="checkbox" onChange={() => toggleExtra("clean")} checked={options.extras.includes("clean")} />{" "}
            Vệ sinh
          </label>
          <label>
            <input
              type="checkbox"
              onChange={() => toggleExtra("storage")}
              checked={options.extras.includes("storage")}
            />{" "}
            Lưu kho tạm
          </label>
        </div>
      </fieldset>

      <button onClick={calc}>Tính báo giá</button>

      {quote && (
        <div style={{ marginTop: 20 }}>
          <h3>Tổng tạm tính: {quote.total.toLocaleString()} ₫</h3>
          <p>
            {quote.distanceKm?.toFixed(1)} km • {Math.round(quote.durationMin)} phút ước tính
          </p>
          <button onClick={() => nav("/contracts/draft", { state: { request: state, quote } })}>
            Tạo hợp đồng
          </button>
        </div>
      )}

      {msg && <div style={{ color: "red" }}>{msg}</div>}
    </div>
  );
}

const fs = { border: "1px solid #ccc", borderRadius: 6, padding: 12, marginBottom: 20 };
const ipt = { margin: "4px", padding: "4px 6px" };
const itemBox = { borderBottom: "1px dashed #ccc", padding: 8, marginBottom: 8 };
