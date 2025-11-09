// client/src/pages/StaffSurveyPage.jsx - Màn hình khảo sát và nhập đồ dùng cho staff
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequest, updateRequest } from "../api/requestApi";
import { estimateQuote } from "../api/quoteApi";
import { fileToBase64 } from "../utils/toBase64";
import { fmtAddress } from "../utils/address";
import "../styles/movingService.css";

const MAX_IMAGES_PER_ITEM = 4;
const MAX_FILE_MB = 1.5;

const VEHICLE_PRICES = {
  "0.5T": { base: 8000, min: 350000, name: "Xe 0.5 tấn" },
  "1T": { base: 10000, min: 450000, name: "Xe 1 tấn" },
  "1.25T": { base: 12000, min: 500000, name: "Xe 1.25 tấn" },
  "2T": { base: 14000, min: 600000, name: "Xe 2 tấn" },
  "3.5T": { base: 17000, min: 750000, name: "Xe 3.5 tấn" },
};

const LABOR_FEE_PER_PERSON = 150000;
const EXTRA_SERVICES = {
  wrap: { name: "Gói đồ kỹ", price: 50000 },
  disassemble: { name: "Tháo/lắp nội thất", price: 80000 },
  climb: { name: "Vận chuyển tầng cao", price: 10000, perFloor: true },
  clean: { name: "Vệ sinh sau chuyển", price: 100000 },
  storage: { name: "Lưu kho tạm", price: 300000, perMonth: true },
};

export default function StaffSurveyPage() {
  const { id } = useParams();
  const nav = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeStep, setActiveStep] = useState("items"); // "items" | "service" | "summary"

  // Items state
  const [items, setItems] = useState([
    { name: "", weight: "", length: "", width: "", height: "", images: [], isApartment: false }
  ]);

  // Service state
  const [vehicleType, setVehicleType] = useState("1T");
  const [extraLabor, setExtraLabor] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState({});
  const [climbFloors, setClimbFloors] = useState(0);
  const [storageMonths, setStorageMonths] = useState(1);

  // Quote state
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const data = await getRequest(id);
      setRequest(data);
      
      // Nếu request đã có items trong notes, load lại
      try {
        if (data.notes) {
          const notesData = JSON.parse(data.notes);
          if (notesData.items && notesData.items.length > 0) {
            setItems(notesData.items);
          }
          if (notesData.vehicleType) setVehicleType(notesData.vehicleType);
          if (notesData.helpers) setExtraLabor(Math.max(0, notesData.helpers - 2));
          if (notesData.extras) {
            const extrasObj = {};
            notesData.extras.forEach(e => extrasObj[e] = true);
            setSelectedExtras(extrasObj);
          }
          if (notesData.climbFloors) setClimbFloors(notesData.climbFloors);
        }
      } catch (e) {
        console.warn("Could not parse notes:", e);
      }
    } catch (err) {
      setMsg("❌ Không tải được thông tin request: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  // Items management
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

  // Service management
  const toggleExtra = (key) => {
    const newValue = !selectedExtras[key];
    setSelectedExtras(prev => ({ ...prev, [key]: newValue }));
    if (key === "climb" && newValue && climbFloors === 0) {
      setClimbFloors(1);
    } else if (key === "climb" && !newValue) {
      setClimbFloors(0);
    }
    if (key === "storage" && !newValue) {
      setStorageMonths(1);
    }
  };

  // Calculate quote
  const calculateQuote = async () => {
    if (!request) return;
    
    const hasValidItem = items.some(it => it.name.trim());
    if (!hasValidItem) {
      alert("Vui lòng thêm ít nhất một đồ dùng cần vận chuyển.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        pickupLocation: request.pickupLocation?.coordinates 
          ? { lat: request.pickupLocation.coordinates[1], lng: request.pickupLocation.coordinates[0] }
          : null,
        deliveryLocation: request.deliveryLocation?.coordinates
          ? { lat: request.deliveryLocation.coordinates[1], lng: request.deliveryLocation.coordinates[0] }
          : null,
        vehicleType,
        helpers: 2 + extraLabor,
        extras: Object.keys(selectedExtras).filter(k => selectedExtras[k]),
        items: items.filter(it => it.name.trim()),
        climbFloors: selectedExtras.climb ? climbFloors : 0,
        storageMonths: selectedExtras.storage ? storageMonths : 0,
        serviceType: "STANDARD",
      };

      const result = await estimateQuote(payload);
      setQuote(result);
      setActiveStep("summary");
    } catch (err) {
      setMsg("❌ Không tính được báo giá: " + (err.message || "Lỗi không xác định"));
    } finally {
      setSubmitting(false);
    }
  };

  // Submit survey
  const handleSubmit = async () => {
    if (!request || !quote) return;

    try {
      setSubmitting(true);
      setMsg("");

      const quoteInfo = {
        items: items.filter(it => it.name.trim()),
        vehicleType,
        helpers: 2 + extraLabor,
        extras: Object.keys(selectedExtras).filter(k => selectedExtras[k]),
        climbFloors: selectedExtras.climb ? climbFloors : 0,
        storageMonths: selectedExtras.storage ? storageMonths : 0,
        quoteTotal: quote.total,
      };

      // Cập nhật request với items và quote, chuyển status sang WAITING_PAYMENT
      await updateRequest(id, {
        notes: JSON.stringify(quoteInfo),
        status: "WAITING_PAYMENT", // Đã khảo sát xong, chờ thanh toán
      });

      setMsg("✅ Đã hoàn thành khảo sát và tạo báo giá thành công!");
      setTimeout(() => nav("/staff/dashboard"), 1500);
    } catch (err) {
      setMsg("❌ Lỗi khi lưu: " + (err.message || "Lỗi không xác định"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="moving-service-container">
        <div className="content-wrapper">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Đang tải thông tin request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="moving-service-container">
        <div className="content-wrapper">
          <div className="empty-state">
            <h3>Không tìm thấy request</h3>
            <button className="btn btn-primary" onClick={() => nav("/staff/dashboard")}>
              Quay lại Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="moving-service-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1>Khảo Sát & Nhập Đồ Dùng</h1>
          <p>Request #{request._id.slice(-8)} - {request.customerName}</p>
        </div>

        {/* Request Info */}
        <div className="main-card">
          <h2 style={{ marginTop: 0 }}>Thông tin request</h2>
          <div className="move-details">
            <p><strong>Khách hàng:</strong> {request.customerName}</p>
            <p><strong>SĐT:</strong> {request.customerPhone}</p>
            <p><strong>Lấy hàng:</strong> {fmtAddress(request.pickupAddress || request.address)}</p>
            <p><strong>Giao hàng:</strong> {fmtAddress(request.deliveryAddress || request.address)}</p>
            <p><strong>Thời gian chuyển:</strong> {new Date(request.movingTime).toLocaleString("vi-VN")}</p>
          </div>
        </div>

        {msg && (
          <div className={`message ${msg.includes("✅") ? "success" : "error"}`}>
            {msg}
          </div>
        )}

        {/* Step Navigation */}
        <div className="main-card">
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid #e9ecef", paddingBottom: "1rem" }}>
            <button
              onClick={() => setActiveStep("items")}
              className={`btn ${activeStep === "items" ? "btn-primary" : "btn-secondary"}`}
            >
              1. Nhập đồ dùng
            </button>
            <button
              onClick={() => setActiveStep("service")}
              className={`btn ${activeStep === "service" ? "btn-primary" : "btn-secondary"}`}
              disabled={!items.some(it => it.name.trim())}
            >
              2. Chọn xe & dịch vụ
            </button>
            <button
              onClick={calculateQuote}
              className={`btn ${activeStep === "summary" ? "btn-primary" : "btn-secondary"}`}
              disabled={!items.some(it => it.name.trim())}
            >
              3. Xem báo giá
            </button>
          </div>

          {/* Step 1: Items */}
          {activeStep === "items" && (
            <div>
              <h2 style={{ marginTop: 0 }}>Nhập đồ dùng cần vận chuyển</h2>
              <p style={{ color: "#7f8c8d", marginBottom: "1.5rem" }}>
                Nhập thông tin các đồ dùng khách hàng muốn chuyển. Bạn có thể thêm nhiều đồ dùng.
              </p>

              {items.map((item, idx) => (
                <div key={idx} className="form-section" style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ margin: 0 }}>Đồ dùng #{idx + 1}</h3>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="btn btn-danger"
                        style={{ padding: "0.5rem 1rem" }}
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label>Tên đồ dùng *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tủ lạnh, Bàn ghế, TV..."
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Cân nặng (kg)</label>
                      <input
                        type="number"
                        placeholder="kg"
                        value={item.weight}
                        onChange={(e) => updateItem(idx, "weight", e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Dài (cm)</label>
                      <input
                        type="number"
                        placeholder="cm"
                        value={item.length}
                        onChange={(e) => updateItem(idx, "length", e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Rộng (cm)</label>
                      <input
                        type="number"
                        placeholder="cm"
                        value={item.width}
                        onChange={(e) => updateItem(idx, "width", e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cao (cm)</label>
                      <input
                        type="number"
                        placeholder="cm"
                        value={item.height}
                        onChange={(e) => updateItem(idx, "height", e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.isApartment}
                        onChange={(e) => updateItem(idx, "isApartment", e.target.checked)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      Nhà chung cư / Tầng cao
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Ảnh (tối đa {MAX_IMAGES_PER_ITEM} ảnh)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => addImages(idx, e.target.files)}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
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
              ))}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button onClick={addItem} className="btn btn-secondary">
                  + Thêm đồ dùng
                </button>
                <button
                  onClick={() => setActiveStep("service")}
                  className="btn btn-primary"
                  disabled={!items.some(it => it.name.trim())}
                  style={{ flex: 1 }}
                >
                  Tiếp theo: Chọn xe & dịch vụ →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Service */}
          {activeStep === "service" && (
            <div>
              <h2 style={{ marginTop: 0 }}>Chọn xe và dịch vụ</h2>
              
              <div className="form-section">
                <h3>Loại xe</h3>
                <div className="form-row">
                  {Object.keys(VEHICLE_PRICES).map((key) => (
                    <label key={key} style={{ cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="vehicleType"
                        value={key}
                        checked={vehicleType === key}
                        onChange={(e) => setVehicleType(e.target.value)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {VEHICLE_PRICES[key].name} ({VEHICLE_PRICES[key].base.toLocaleString()}₫/km)
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Nhân công</h3>
                <div className="form-group">
                  <label>Số người thêm (mặc định: 2 người - 1 lái xe + 1 staff)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={extraLabor}
                    onChange={(e) => setExtraLabor(parseInt(e.target.value) || 0)}
                  />
                  <p style={{ color: "#7f8c8d", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                    Tổng: {2 + extraLabor} người × {LABOR_FEE_PER_PERSON.toLocaleString()}₫ = {(2 + extraLabor) * LABOR_FEE_PER_PERSON.toLocaleString()}₫
                  </p>
                </div>
              </div>

              <div className="form-section">
                <h3>Dịch vụ thêm</h3>
                {Object.keys(EXTRA_SERVICES).map((key) => (
                  <div key={key} style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedExtras[key] || false}
                        onChange={() => toggleExtra(key)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      <span style={{ flex: 1 }}>
                        {EXTRA_SERVICES[key].name} - {EXTRA_SERVICES[key].price.toLocaleString()}₫
                        {EXTRA_SERVICES[key].perFloor && " / tầng"}
                        {EXTRA_SERVICES[key].perMonth && " / tháng"}
                      </span>
                    </label>
                    {key === "climb" && selectedExtras.climb && (
                      <div style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                        <label>
                          Số tầng:
                          <input
                            type="number"
                            min="1"
                            value={climbFloors}
                            onChange={(e) => setClimbFloors(parseInt(e.target.value) || 1)}
                            style={{ marginLeft: "0.5rem", width: "80px" }}
                          />
                        </label>
                      </div>
                    )}
                    {key === "storage" && selectedExtras.storage && (
                      <div style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                        <label>
                          Số tháng:
                          <input
                            type="number"
                            min="1"
                            value={storageMonths}
                            onChange={(e) => setStorageMonths(parseInt(e.target.value) || 1)}
                            style={{ marginLeft: "0.5rem", width: "80px" }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button onClick={() => setActiveStep("items")} className="btn btn-secondary">
                  ← Quay lại
                </button>
                <button onClick={calculateQuote} className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? "Đang tính..." : "Tính báo giá →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {activeStep === "summary" && quote && (
            <div>
              <h2 style={{ marginTop: 0 }}>Báo giá</h2>
              
              <div className="form-section" style={{ background: "#e8f5e9", borderLeftColor: "#4caf50" }}>
                <h3 style={{ color: "#2e7d32" }}>Chi tiết báo giá</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "0.75rem" }}>Vận chuyển ({quote.distanceKm?.toFixed(1)} km)</td>
                      <td style={{ textAlign: "right", padding: "0.75rem" }}>{quote.vehicleFee?.toLocaleString()}₫</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "0.75rem" }}>Nhân công ({2 + extraLabor} người)</td>
                      <td style={{ textAlign: "right", padding: "0.75rem" }}>{quote.laborFee?.toLocaleString()}₫</td>
                    </tr>
                    {quote.extrasFee > 0 && (
                      <tr>
                        <td style={{ padding: "0.75rem" }}>Dịch vụ thêm</td>
                        <td style={{ textAlign: "right", padding: "0.75rem" }}>{quote.extrasFee?.toLocaleString()}₫</td>
                      </tr>
                    )}
                    {quote.itemFee > 0 && (
                      <tr>
                        <td style={{ padding: "0.75rem" }}>Phí theo thể tích</td>
                        <td style={{ textAlign: "right", padding: "0.75rem" }}>{quote.itemFee?.toLocaleString()}₫</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: "2px solid #2e7d32", fontWeight: "bold", fontSize: "1.2em" }}>
                      <td style={{ padding: "0.75rem" }}>TỔNG CỘNG</td>
                      <td style={{ textAlign: "right", padding: "0.75rem", color: "#2e7d32" }}>
                        {quote.total?.toLocaleString()}₫
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button onClick={() => setActiveStep("service")} className="btn btn-secondary">
                  ← Quay lại
                </button>
                <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? "Đang lưu..." : "Hoàn thành khảo sát & Gửi báo giá"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

