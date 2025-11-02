// client/src/pages/QuoteItemsPage.jsx - Màn 1: Thêm đồ dùng
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fileToBase64 } from "../utils/toBase64";

const MAX_IMAGES_PER_ITEM = 4;
const MAX_FILE_MB = 1.5;

export default function QuoteItemsPage() {
  const { state } = useLocation();
  const nav = useNavigate();
  
  const [items, setItems] = useState([
    { name: "", weight: "", length: "", width: "", height: "", images: [], isApartment: false }
  ]);

  const addItem = () => {
    setItems([...items, { name: "", weight: "", length: "", width: "", height: "", images: [], isApartment: false }]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(items.map((it, i) => 
      i === idx ? { ...it, [field]: value } : it
    ));
  };

  const addImages = async (idx, files) => {
    const filesList = Array.from(files || []);
    if (!filesList.length) return;

    const item = items[idx];
    const remain = MAX_IMAGES_PER_ITEM - item.images.length;
    if (remain <= 0) {
      alert(`Chỉ được thêm tối đa ${MAX_IMAGES_PER_ITEM} ảnh cho mỗi đồ dùng.`);
      return;
    }

    const arr = [];
    for (const f of filesList.slice(0, remain)) {
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_MB) {
        alert(`Ảnh ${f.name} vượt ${MAX_FILE_MB}MB`);
        return;
      }
      arr.push(await fileToBase64(f));
    }

    setItems(items.map((it, i) => 
      i === idx ? { ...it, images: [...it.images, ...arr] } : it
    ));
  };

  const removeImage = (itemIdx, imgIdx) => {
    setItems(items.map((it, i) => 
      i === itemIdx ? { ...it, images: it.images.filter((_, idx) => idx !== imgIdx) } : it
    ));
  };

  const handleNext = () => {
    // Validate: ít nhất 1 đồ dùng có tên
    const hasValidItem = items.some(it => it.name.trim());
    if (!hasValidItem) {
      alert("Vui lòng thêm ít nhất một đồ dùng cần vận chuyển.");
      return;
    }

    const payload = {
      ...state,
      items: items.filter(it => it.name.trim()), // Chỉ lấy items có tên
    };
    
    nav("/quote/service", { state: payload });
  };

  const hasApartment = items.some(it => it.isApartment);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <h1>Thêm đồ dùng cần vận chuyển</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Nhập thông tin các đồ dùng bạn muốn chuyển. Bạn có thể thêm nhiều đồ dùng.
      </p>

      {items.map((item, idx) => (
        <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Đồ dùng #{idx + 1}</h3>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                style={{ padding: "4px 8px", background: "#c00", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
              >
                Xóa
              </button>
            )}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label>Tên đồ dùng *</label>
              <input
                type="text"
                placeholder="Ví dụ: Tủ lạnh, Bàn ghế, TV..."
                value={item.name}
                onChange={(e) => updateItem(idx, "name", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label>Cân nặng (kg)</label>
                <input
                  type="number"
                  placeholder="kg"
                  value={item.weight}
                  onChange={(e) => updateItem(idx, "weight", e.target.value)}
                  style={inputStyle}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label>Dài (cm)</label>
                <input
                  type="number"
                  placeholder="cm"
                  value={item.length}
                  onChange={(e) => updateItem(idx, "length", e.target.value)}
                  style={inputStyle}
                  min="0"
                />
              </div>
              <div>
                <label>Rộng (cm)</label>
                <input
                  type="number"
                  placeholder="cm"
                  value={item.width}
                  onChange={(e) => updateItem(idx, "width", e.target.value)}
                  style={inputStyle}
                  min="0"
                />
              </div>
              <div>
                <label>Cao (cm)</label>
                <input
                  type="number"
                  placeholder="cm"
                  value={item.height}
                  onChange={(e) => updateItem(idx, "height", e.target.value)}
                  style={inputStyle}
                  min="0"
                />
              </div>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={item.isApartment}
                  onChange={(e) => updateItem(idx, "isApartment", e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Nhà chung cư / Tầng cao (có thể tính thêm phí vận chuyển)
              </label>
            </div>

            <div>
              <label>Ảnh (tối đa {MAX_IMAGES_PER_ITEM} ảnh)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => addImages(idx, e.target.files)}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {item.images.map((img, imgIdx) => (
                  <div key={imgIdx} style={{ position: "relative" }}>
                    <img
                      src={img}
                      alt={`Item ${idx + 1} - ${imgIdx + 1}`}
                      style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, imgIdx)}
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#c00",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={addItem} style={{ ...btnStyle, background: "#666" }}>
          + Thêm đồ dùng
        </button>
        <button onClick={() => nav(-1)} style={{ ...btnStyle, background: "#999" }}>
          Quay lại
        </button>
        <button onClick={handleNext} style={{ ...btnStyle, background: "#111", flex: 1 }}>
          Tiếp theo: Chọn xe và dịch vụ →
        </button>
      </div>

      {hasApartment && (
        <div style={{ marginTop: 12, padding: 12, background: "#fff3cd", borderRadius: 6, color: "#856404" }}>
          ⚠️ Bạn đã chọn nhà chung cư/tầng cao. Có thể tính thêm phí vận chuyển tầng cao.
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
  width: "100%",
  fontSize: 14,
};

const btnStyle = {
  padding: "10px 16px",
  border: "none",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

