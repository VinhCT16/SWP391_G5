import { useEffect, useState } from "react";
import { listRequestsByPhone, cancelRequest } from "../api/requestApi";
import { fmtDateTime24 } from "../utils/datetime";
import { fmtAddress } from "../utils/address";

const VN_STATUS = {
  PENDING_REVIEW: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export default function RequestList({ phone }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!phone) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await listRequestsByPhone(phone);
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [phone]);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy request này?")) return;
    await cancelRequest(id);
    load();
  };

  if (!phone) return <p>Nhập SĐT để tra cứu request</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Tên</th><th>SDT</th><th>Địa chỉ</th><th>Thời gian</th><th>Dịch vụ</th><th>Trạng thái</th><th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {loading
          ? <tr><td colSpan="7">Đang tải...</td></tr>
          : rows.map((r) => (
            <tr key={r._id}>
              <td>{r.customerName}</td>
              <td>{r.customerPhone}</td>
              <td>{fmtAddress(r.address)}</td> {/* ✅ */}
              <td>{fmtDateTime24(r.movingTime)}</td>
              <td>{r.serviceType === "EXPRESS" ? "Hỏa tốc" : "Thường"}</td>
              <td>{VN_STATUS[r.status] || r.status}</td>
              <td>
                {r.status === "PENDING_REVIEW" ? (
                  <>
                    <button onClick={() => alert("TODO: Edit form")}>Sửa</button>{" "}
                    <button onClick={() => handleCancel(r._id)}>Hủy</button>
                  </>
                ) : (
                  <button disabled>Sửa</button>
                )}
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}
