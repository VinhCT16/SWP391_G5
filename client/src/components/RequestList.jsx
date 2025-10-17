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

export default function RequestList({ phone, onEdit }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!phone) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await listRequestsByPhone(phone);
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [phone]);

  async function handleCancel(id) {
    if (!window.confirm("Bạn có chắc chắn muốn hủy request này?")) return;
    await cancelRequest(id);
    load();
  }

  if (!phone) return <p>Nhập SĐT để tra cứu request</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Tên</th>
          <th>SDT</th>
          <th>Địa chỉ LẤY HÀNG</th>
          <th>Địa chỉ GIAO HÀNG</th>
          <th>Thời gian</th>
          <th>Dịch vụ</th>
          <th>Trạng thái</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {loading && (
          <tr><td colSpan={8}>Đang tải...</td></tr>
        )}
        {!loading && rows.length === 0 && (
          <tr><td colSpan={8}>Không có dữ liệu</td></tr>
        )}
        {!loading && rows.length > 0 && rows.map((r) => {
          const canEdit = r.status === "PENDING_REVIEW";
          const canCancel = r.status === "PENDING_REVIEW" || r.status === "APPROVED";
          return (
            <tr key={r._id}>
              <td>{r.customerName}</td>
              <td>{r.customerPhone}</td>
              <td>{fmtAddress(r.pickupAddress)}</td>
              <td>{fmtAddress(r.deliveryAddress)}</td>
              <td>{fmtDateTime24(r.movingTime)}</td>
              <td>{r.serviceType === "EXPRESS" ? "Hỏa tốc" : "Thường"}</td>
              <td>{VN_STATUS[r.status] || r.status}</td>
              <td>
                <button onClick={() => (onEdit ? onEdit(r._id) : alert("TODO: Edit form"))} disabled={!canEdit} style={{ marginRight: 8 }}>Sửa</button>
                <button onClick={() => handleCancel(r._id)} disabled={!canCancel}>Hủy</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
