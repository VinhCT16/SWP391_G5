import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRequest } from "../api/requestApi";
import { fmtNumber } from "../utils/format";

export default function RequestDetailPage() {
  const { id } = useParams();
  const [req, setReq] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await getRequest(id);
      setReq(r);
    })();
  }, [id]);

  if (!req) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }}>
      <h1>Chi tiết Request</h1>
      <div>Khách: {req.customerName}</div>
      <div>SĐT: {req.customerPhone}</div>
      <div>Địa chỉ lấy: {req.pickupAddress?.street}</div>
      <div>Địa chỉ giao: {req.deliveryAddress?.street}</div>
      <div>Thời gian: {new Date(req.movingTime).toLocaleString()}</div>

      <div style={{ display: "flex", gap: 12 }}>
        <Link to={`/requests/${id}/quote-builder`} style={btn}>Tạo báo giá</Link>
        <Link to={`/requests/${id}/quotes`} style={btnHollow}>Xem báo giá</Link>
      </div>
    </div>
  );
}

const btn = { padding: "8px 12px", background: "#111", color: "#fff", borderRadius: 8 };
const btnHollow = { padding: "8px 12px", background: "#fff", border: "1px solid #111", borderRadius: 8 };
