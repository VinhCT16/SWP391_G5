// client/src/pages/QuoteServicePage.jsx - Màn 2: Chọn xe và dịch vụ
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Giá dịch vụ (tham khảo thị trường)
const VEHICLE_PRICES = {
  "0.5T": { base: 8000, min: 350000, name: "Xe 0.5 tấn" },
  "1T": { base: 10000, min: 450000, name: "Xe 1 tấn" },
  "1.25T": { base: 12000, min: 500000, name: "Xe 1.25 tấn" },
  "2T": { base: 14000, min: 600000, name: "Xe 2 tấn" },
  "3.5T": { base: 17000, min: 750000, name: "Xe 3.5 tấn" },
};

const LABOR_FEE_PER_PERSON = 150000; // 150k/người (mặc định đã có 2 người: 1 lái xe + 1 staff)

const EXTRA_SERVICES = {
  wrap: { name: "Gói đồ kỹ", price: 50000 },
  disassemble: { name: "Tháo/lắp nội thất", price: 80000 },
  climb: { name: "Vận chuyển tầng cao", price: 10000, perFloor: true }, // 10k/tầng
  clean: { name: "Vệ sinh sau chuyển", price: 100000 },
  storage: { name: "Lưu kho tạm", price: 200000 },
};

export default function QuoteServicePage() {
  const { state } = useLocation();
  const nav = useNavigate();
  
  const [vehicleType, setVehicleType] = useState("1T");
  const [extraLabor, setExtraLabor] = useState(0); // Số người thêm (mặc định đã có 2)
  const [selectedExtras, setSelectedExtras] = useState({});
  const [climbFloors, setClimbFloors] = useState(0); // Số tầng nếu chọn climb

  const toggleExtra = (key) => {
    setSelectedExtras(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    if (key === "climb" && !selectedExtras[key]) {
      setClimbFloors(0);
    }
  };

  const handleNext = () => {
    const payload = {
      ...state,
      vehicleType,
      helpers: 2 + extraLabor, // 2 người mặc định + thêm
      extras: Object.keys(selectedExtras).filter(k => selectedExtras[k]),
      climbFloors: selectedExtras.climb ? climbFloors : 0,
    };
    
    nav("/quote/summary", { state: payload });
  };

  // Tính tạm tính
  const vehiclePrice = VEHICLE_PRICES[vehicleType];
  const extraLaborCost = extraLabor * LABOR_FEE_PER_PERSON;
  const extrasCost = Object.keys(selectedExtras)
    .filter(k => selectedExtras[k])
    .reduce((sum, key) => {
      const service = EXTRA_SERVICES[key];
      if (key === "climb" && climbFloors > 0) {
        return sum + (service.price * climbFloors);
      }
      return sum + (service.price || 0);
    }, 0);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <h1>Chọn xe và dịch vụ</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Chọn loại xe phù hợp và các dịch vụ bổ sung bạn cần.
      </p>

      {/* Chọn loại xe */}
      <fieldset style={fieldsetStyle}>
        <legend>Loại xe</legend>
        <div style={{ display: "grid", gap: 8 }}>
          {Object.entries(VEHICLE_PRICES).map(([key, info]) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                border: vehicleType === key ? "2px solid #111" : "1px solid #ddd",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="vehicle"
                value={key}
                checked={vehicleType === key}
                onChange={(e) => setVehicleType(e.target.value)}
              />
              <div style={{ flex: 1 }}>
                <strong>{info.name}</strong>
                <div style={{ fontSize: "0.9em", color: "#666", marginTop: 4 }}>
                  {info.base.toLocaleString()}₫/km • Tối thiểu: {info.min.toLocaleString()}₫
                </div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Nhân công */}
      <fieldset style={fieldsetStyle}>
        <legend>Nhân công</legend>
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}>
            Mặc định: <strong>2 người</strong> (1 lái xe + 1 staff) - Đã bao gồm
          </div>
          <label>
            Thêm nhân công (150.000₫/người):
            <input
              type="number"
              min="0"
              max="5"
              value={extraLabor}
              onChange={(e) => setExtraLabor(Math.max(0, parseInt(e.target.value) || 0))}
              style={inputStyle}
            />
          </label>
          {extraLabor > 0 && (
            <div style={{ marginTop: 8, color: "#666" }}>
              Tổng: {2 + extraLabor} người • Phí thêm: {extraLaborCost.toLocaleString()}₫
            </div>
          )}
        </div>
      </fieldset>

      {/* Dịch vụ thêm */}
      <fieldset style={fieldsetStyle}>
        <legend>Dịch vụ thêm</legend>
        <div style={{ display: "grid", gap: 12 }}>
          {Object.entries(EXTRA_SERVICES).map(([key, service]) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selectedExtras[key] || false}
                onChange={() => toggleExtra(key)}
              />
              <div style={{ flex: 1 }}>
                <strong>{service.name}</strong>
                {service.perFloor ? (
                  <div style={{ fontSize: "0.9em", color: "#666", marginTop: 4 }}>
                    {service.price.toLocaleString()}₫/tầng
                  </div>
                ) : (
                  <div style={{ fontSize: "0.9em", color: "#666", marginTop: 4 }}>
                    {service.price.toLocaleString()}₫
                  </div>
                )}
              </div>
              {selectedExtras[key] && service.perFloor && (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={climbFloors || 1}
                    onChange={(e) => setClimbFloors(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ ...inputStyle, width: 80 }}
                    placeholder="Tầng"
                  />
                  <div style={{ fontSize: "0.8em", color: "#666", marginTop: 4 }}>
                    = {(service.price * (climbFloors || 1)).toLocaleString()}₫
                  </div>
                </div>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Tạm tính */}
      <div style={{ marginTop: 20, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Tạm tính dịch vụ:</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Loại xe ({vehiclePrice.name}):</span>
            <strong>Ước tính theo km</strong>
          </div>
          {extraLabor > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Thêm nhân công ({extraLabor} người):</span>
              <strong>{extraLaborCost.toLocaleString()}₫</strong>
            </div>
          )}
          {extrasCost > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Dịch vụ thêm:</span>
              <strong>{extrasCost.toLocaleString()}₫</strong>
            </div>
          )}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", fontSize: "1.1em" }}>
            <span>Tạm tính:</span>
            <strong>{(extraLaborCost + extrasCost).toLocaleString()}₫</strong>
          </div>
          <div style={{ fontSize: "0.9em", color: "#666", marginTop: 4 }}>
            * Giá cuối cùng sẽ được tính dựa trên khoảng cách thực tế
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={() => nav(-1)} style={{ ...btnStyle, background: "#999" }}>
          ← Quay lại
        </button>
        <button onClick={handleNext} style={{ ...btnStyle, background: "#111", flex: 1 }}>
          Tiếp theo: Xem tổng giá →
        </button>
      </div>
    </div>
  );
}

const fieldsetStyle = {
  padding: 16,
  border: "1px solid #ddd",
  borderRadius: 8,
  marginBottom: 20,
};

const inputStyle = {
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
  marginLeft: 8,
};

const btnStyle = {
  padding: "12px 20px",
  border: "none",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

