import { useLocation, useNavigate } from "react-router-dom";

export default function DraftContractPage() {
  const { state } = useLocation();
  const nav = useNavigate();
  const req = state?.request || {};
  const quote = state?.quote || {};

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <h1>Hợp đồng nháp</h1>
      <div style={{ margin: "12px 0" }}>
        <div><b>Khách hàng:</b> {req?.customerName} • {req?.customerPhone}</div>
        <div><b>Lấy hàng:</b> {req?.pickupAddressText}</div>
        <div><b>Giao hàng:</b> {req?.deliveryAddressText}</div>
        {quote?.total ? (
          <div style={{ marginTop: 8 }}>
            <b>Tổng tạm tính:</b> {quote.total?.toLocaleString()} ₫ • {quote.distanceKm?.toFixed(1)} km • {Math.round(quote.durationMin || 0)} phút
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => nav(-1)}>Quay lại</button>
        <button onClick={() => alert("TBD")}>Lưu nháp</button>
      </div>
    </div>
  );
}


