import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuote, negotiateQuote, respondQuote, confirmQuote } from "../api/quoteApi";
import { fmtNumber } from "../utils/format";

export default function QuoteDetailPage() {
  const { id } = useParams(); // quoteId
  const [quote, setQuote] = useState(null);
  const [proposePrice, setProposePrice] = useState("");
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    const r = await getQuote(id);
    setQuote(r);
  };

  useEffect(() => {
    refresh();
  }, [id]);

  const sendProposal = async () => {
    try {
      await negotiateQuote(id, Number(proposePrice));
      setMsg("Đã gửi đề xuất giá.");
      setProposePrice("");
      refresh();
    } catch {
      setMsg("Gửi đề xuất thất bại.");
    }
  };

  const accept = async () => {
    await respondQuote(id, "accept");
    setMsg("✅ Đã chấp nhận giá.");
    refresh();
  };

  const counter = async () => {
    await respondQuote(id, "counter", Number(proposePrice));
    setMsg("Đã phản hồi giá.");
    setProposePrice("");
    refresh();
  };

  const confirm = async () => {
    await confirmQuote(id);
    setMsg("✅ Đã xác nhận báo giá cuối cùng.");
    refresh();
  };

  if (!quote) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }}>
      <h1>Chi tiết báo giá</h1>
      <div>Giá gốc: {fmtNumber(quote.basePrice)} đ</div>
      <div>Giá đề xuất: {quote.negotiatedPrice ? fmtNumber(quote.negotiatedPrice) + " đ" : "Chưa có"}</div>
      <div>Giá chốt: {quote.finalPrice ? fmtNumber(quote.finalPrice) + " đ" : "Chưa chốt"}</div>
      <div>Trạng thái: <b>{quote.status}</b></div>

      <section style={panel}>
        <h3>Lịch sử thương lượng</h3>
        {quote.negotiationHistory.length === 0 && <div>Chưa có trao đổi nào.</div>}
        {quote.negotiationHistory.map((h, i) => (
          <div key={i}>
            [{h.from}] đề xuất {fmtNumber(h.price)} đ • {new Date(h.at).toLocaleString()}
          </div>
        ))}
      </section>

      <section style={panel}>
        <h3>Gửi đề xuất / phản hồi</h3>
        <input
          type="number"
          placeholder="Nhập giá đề xuất"
          value={proposePrice}
          onChange={e => setProposePrice(e.target.value)}
          style={ipt}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={sendProposal} style={btn}>Khách: Gửi đề xuất</button>
          <button onClick={counter} style={btn}>Staff: Phản hồi</button>
          <button onClick={accept} style={btnHollow}>Staff: Chấp nhận</button>
          <button onClick={confirm} style={btnConfirm}>Xác nhận giá cuối</button>
        </div>
      </section>

      {msg && <div style={{ color: "#090" }}>{msg}</div>}
    </div>
  );
}

const panel = { padding: 12, border: "1px dashed #aaa", borderRadius: 8 };
const ipt = { padding: 8, border: "1px solid #ccc", borderRadius: 6 };
const btn = { padding: "8px 12px", background: "#111", color: "#fff", borderRadius: 8 };
const btnHollow = { padding: "8px 12px", background: "#fff", border: "1px solid #111", borderRadius: 8 };
const btnConfirm = { padding: "8px 12px", background: "#006400", color: "#fff", borderRadius: 8 };
