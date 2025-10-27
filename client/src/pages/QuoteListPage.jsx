import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { listQuotes } from "../api/quoteApi";
import { fmtNumber } from "../utils/format";

export default function QuoteListPage() {
  const { id } = useParams(); // requestId
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    (async () => {
      const r = await listQuotes(id);
      setQuotes(r);
    })();
  }, [id]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Danh sách báo giá</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Mã</th>
            <th style={th}>Giá</th>
            <th style={th}>Trạng thái</th>
            <th style={th}>Cập nhật</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {quotes.map(q => (
            <tr key={q._id}>
              <td style={td}>{q._id.slice(-6)}</td>
              <td style={td}>{fmtNumber(q.finalPrice || q.basePrice)} đ</td>
              <td style={td}>{q.status}</td>
              <td style={td}>{new Date(q.updatedAt).toLocaleString()}</td>
              <td style={td}>
                <Link to={`/quotes/${q._id}`} style={btn}>Xem</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" };
const td = { padding: 8, borderBottom: "1px solid #eee" };
const btn = { padding: "4px 8px", background: "#111", color: "#fff", borderRadius: 4 };
