import { useMemo } from "react";
import { fmtAddress } from "../utils/address";
import { fmtDateTime24 } from "../utils/datetime";

const VN_STATUS = {
  PENDING_REVIEW: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export default function RequestList({ items = [], onEdit, onCancel }) {
  const rows = useMemo(() => items.map((r) => ({
    id: r._id,
    pickupAddress: r.pickupAddress || r.address || null,
    deliveryAddress: r.deliveryAddress || r.address || null,
    movingTime: r.movingTime,
    status: r.status,
  })), [items]);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={th}>Lấy hàng</th>
          <th style={th}>Giao hàng</th>
          <th style={th}>Thời gian</th>
          <th style={th}>Trạng thái</th>
          <th style={th}>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td style={td}>{r.pickupAddress ? fmtAddress(r.pickupAddress) : "-"}</td>
            <td style={td}>{r.deliveryAddress ? fmtAddress(r.deliveryAddress) : "-"}</td>
            <td style={td}>{fmtDateTime24(r.movingTime)}</td>
            <td style={td}>{VN_STATUS[r.status] || r.status}</td>
            <td style={td}>
              <button onClick={() => onEdit?.(r.id)}>Sửa</button>{" "}
              <button onClick={() => onCancel?.(r.id)}>Hủy</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th = { textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" };
const td = { padding: 8, borderBottom: "1px solid #eee" };
