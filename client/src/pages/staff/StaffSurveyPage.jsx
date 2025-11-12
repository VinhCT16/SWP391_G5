// client/src/pages/staff/StaffTaskDetailPage.jsx - Chi tiáº¿t task vÃ  cáº­p nháº­t tráº¡ng thÃ¡i
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequest, updateRequest } from "../../api/requestApi";
import { fmtAddress } from "../../utils/address";
import { fmtDateTime24 } from "../../utils/datetime";
import RouteMapLibre from "../../components/map/RouteMapLibre";
import "../../styles/movingService.css";

const STATUS_CONFIG = {
  WAITING_PAYMENT: { label: "Chá» thanh toÃ¡n", color: "#9c27b0", bg: "#f3e5f5" },
  IN_PROGRESS: { label: "Äang váº­n chuyá»ƒn", color: "#00bcd4", bg: "#e0f7fa" },
  DONE: { label: "ÄÃ£ hoÃ n thÃ nh", color: "#4caf50", bg: "#e8f5e9" },
};

export default function StaffTaskDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const data = await getRequest(id);
      setRequest(data);
      setNewStatus(data.status);
    } catch (err) {
      setMsg("âŒ KhÃ´ng táº£i Ä‘Æ°á»£c thÃ´ng tin request: " + (err.message || "Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!request || newStatus === request.status) {
      setMsg("âš ï¸ Tráº¡ng thÃ¡i khÃ´ng thay Ä‘á»•i");
      return;
    }

    if (!window.confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh "${STATUS_CONFIG[newStatus]?.label || newStatus}"?`)) {
      return;
    }

    try {
      setUpdating(true);
      setMsg("");

      // Cáº­p nháº­t status vÃ  actualDelivery náº¿u hoÃ n thÃ nh
      const updateData = { status: newStatus };
      if (newStatus === "DONE" && !request.actualDelivery) {
        updateData.actualDelivery = new Date();
      }

      await updateRequest(id, updateData);
      setRequest(prev => ({ ...prev, ...updateData }));
      setMsg("âœ… Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh cÃ´ng!");
      
      setTimeout(() => nav("/staff/dashboard"), 1500);
    } catch (err) {
      setMsg("âŒ Lá»—i khi cáº­p nháº­t: " + (err.message || "Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="moving-service-container">
        <div className="content-wrapper">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Äang táº£i thÃ´ng tin task...</p>
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
            <h3>KhÃ´ng tÃ¬m tháº¥y task</h3>
            <button className="btn btn-primary" onClick={() => nav("/staff/dashboard")}>
              Quay láº¡i Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status] || { label: request.status, color: "#757575", bg: "#fafafa" };
  const pickupLoc = request.pickupLocation?.coordinates 
    ? { lat: request.pickupLocation.coordinates[1], lng: request.pickupLocation.coordinates[0] }
    : null;
  const deliveryLoc = request.deliveryLocation?.coordinates
    ? { lat: request.deliveryLocation.coordinates[1], lng: request.deliveryLocation.coordinates[0] }
    : null;

  let quoteInfo = null;
  try {
    if (request.notes) quoteInfo = JSON.parse(request.notes);
  } catch (e) {
    console.warn("Could not parse notes:", e);
  }

  return (
    <div className="moving-service-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1>Chi Tiáº¿t Task</h1>
          <p>Request #{request._id.slice(-8)}</p>
        </div>

        {msg && (
          <div className={`message ${msg.includes("âœ…") ? "success" : msg.includes("âš ï¸") ? "info" : "error"}`}>
            {msg}
          </div>
        )}

        {/* Status Info */}
        <div className="main-card">
          <div style={{ padding: "1rem", background: statusConfig.bg, borderRadius: 8, border: `2px solid ${statusConfig.color}`, marginBottom: "1.5rem" }}>
            <strong>Tráº¡ng thÃ¡i hiá»‡n táº¡i:</strong>{" "}
            <span style={{ color: statusConfig.color, fontWeight: "bold", fontSize: "1.1em" }}>
              {statusConfig.label}
            </span>
          </div>

          {/* Update Status (chá»‰ cho IN_PROGRESS vÃ  WAITING_PAYMENT) */}
          {["WAITING_PAYMENT", "IN_PROGRESS"].includes(request.status) && (
            <div className="form-section">
              <h3>Cáº­p nháº­t tráº¡ng thÃ¡i</h3>
              <div className="form-group">
                <label>Tráº¡ng thÃ¡i má»›i</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={updating}
                >
                  {request.status === "WAITING_PAYMENT" && (
                    <option value="WAITING_PAYMENT">Chá» thanh toÃ¡n</option>
                  )}
                  {request.status === "WAITING_PAYMENT" && (
                    <option value="IN_PROGRESS">Äang váº­n chuyá»ƒn</option>
                  )}
                  {request.status === "IN_PROGRESS" && (
                    <option value="IN_PROGRESS">Äang váº­n chuyá»ƒn</option>
                  )}
                  {request.status === "IN_PROGRESS" && (
                    <option value="DONE">ÄÃ£ hoÃ n thÃ nh</option>
                  )}
                </select>
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === request.status}
                className="btn btn-primary"
              >
                {updating ? "Äang cáº­p nháº­t..." : "Cáº­p nháº­t tráº¡ng thÃ¡i"}
              </button>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="main-card">
          <h2 style={{ marginTop: 0 }}>ThÃ´ng tin khÃ¡ch hÃ ng</h2>
          <div className="move-details">
            <p><strong>Há» vÃ  tÃªn:</strong> {request.customerName}</p>
            <p><strong>Sá»‘ Ä‘iá»‡n thoáº¡i:</strong> {request.customerPhone}</p>
          </div>
        </div>

        {/* Address Info */}
        <div className="main-card">
          <h2 style={{ marginTop: 0 }}>Äá»‹a chá»‰</h2>
          <div className="move-details">
            <p>
              <strong style={{ color: "#4caf50" }}>ðŸ“ Láº¥y hÃ ng:</strong> {fmtAddress(request.pickupAddress || request.address)}
            </p>
            <p>
              <strong style={{ color: "#f44336" }}>ðŸŽ¯ Giao hÃ ng:</strong> {fmtAddress(request.deliveryAddress || request.address)}
            </p>
            <p><strong>Thá»i gian chuyá»ƒn:</strong> {fmtDateTime24(request.movingTime)}</p>
          </div>
        </div>

        {/* Map */}
        {pickupLoc && deliveryLoc && (
          <div className="main-card">
            <h2 style={{ marginTop: 0 }}>Tuyáº¿n Ä‘Æ°á»ng</h2>
            <RouteMapLibre
              pickup={pickupLoc}
              delivery={deliveryLoc}
              height={400}
            />
          </div>
        )}

        {/* Items Info */}
        {quoteInfo?.items && quoteInfo.items.length > 0 && (
          <div className="main-card">
            <h2 style={{ marginTop: 0 }}>Äá»“ dÃ¹ng ({quoteInfo.items.length} mÃ³n)</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {quoteInfo.items.map((item, idx) => (
                <div key={idx} style={{ padding: "1rem", background: "#f8f9fa", borderRadius: 6, border: "1px solid #e9ecef" }}>
                  <strong>{item.name}</strong>
                  {item.weight && <span> â€¢ {item.weight}kg</span>}
                  {item.length && item.width && item.height && (
                    <span> â€¢ {item.length}Ã—{item.width}Ã—{item.height}cm</span>
                  )}
                  {item.isApartment && <span> â€¢ NhÃ  chung cÆ°</span>}
                  {item.images && item.images.length > 0 && (
                    <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {item.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt={`${item.name} ${imgIdx + 1}`}
                          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quote Info */}
        {quoteInfo && quoteInfo.quoteTotal && (
          <div className="main-card" style={{ background: "#e8f5e9", border: "2px solid #4caf50" }}>
            <h2 style={{ marginTop: 0, color: "#2e7d32" }}>ThÃ´ng tin bÃ¡o giÃ¡</h2>
            <div className="move-details">
              {quoteInfo.vehicleType && <p><strong>Loáº¡i xe:</strong> {quoteInfo.vehicleType}</p>}
              {quoteInfo.helpers && <p><strong>Sá»‘ nhÃ¢n cÃ´ng:</strong> {quoteInfo.helpers} ngÆ°á»i</p>}
              {quoteInfo.extras && quoteInfo.extras.length > 0 && (
                <p>
                  <strong>Dá»‹ch vá»¥ thÃªm:</strong>{" "}
                  {quoteInfo.extras.map((e) => {
                    const names = {
                      wrap: "GÃ³i Ä‘á»“ ká»¹",
                      disassemble: "ThÃ¡o/láº¯p ná»™i tháº¥t",
                      climb: `Váº­n chuyá»ƒn táº§ng cao (${quoteInfo.climbFloors || 0} táº§ng)`,
                      clean: "Vá»‡ sinh",
                      storage: `LÆ°u kho (${quoteInfo.storageMonths || 0} thÃ¡ng)`,
                    };
                    return names[e] || e;
                  }).join(", ")}
                </p>
              )}
              <p style={{ marginTop: "1rem", padding: "1rem", background: "white", borderRadius: 6 }}>
                <strong style={{ fontSize: "1.2em", color: "#2e7d32" }}>
                  Tá»•ng giÃ¡: {quoteInfo.quoteTotal.toLocaleString()}â‚«
                </strong>
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button onClick={() => nav("/staff/dashboard")} className="btn btn-secondary" style={{ flex: 1 }}>
            â† Quay láº¡i Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

