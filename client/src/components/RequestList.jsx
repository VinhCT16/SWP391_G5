import { useEffect, useState } from "react";
import { listRequests, deleteRequest } from "../api/requestApi";

const STATUS_LABEL = {
  pending: "Đang chờ duyệt",
  approved: "Đã duyệt",
  cancelled: "Đã hủy",
  in_progress: "Đang thực hiện",
};

export default function RequestList({ phone }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await listRequests(phone);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    if (phone) load();
  }, [phone]);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy request này?")) return;
    await deleteRequest(id);
    load();
  };

  if (!phone) return <p>Nhập SĐT để tra cứu request</p>;

  return (
    <table>
      <thead>
        <tr><th>Tên</th><th>SDT</th><th>Địa chỉ</th><th>Thời gian</th><th>Dịch vụ</th><th>Trạng thái</th><th>Hành động</th></tr>
      </thead>
      <tbody>
        {loading ? <tr><td colSpan="7">Đang tải...</td></tr> : rows.map(r => (
          <tr key={r._id}>
            <td>{r.name}</td>
            <td>{r.phone}</td>
            <td>{r.address}</td>
            <td>{new Date(r.deliveryTime).toLocaleString("vi-VN", { hour12: false })}</td>
            <td>{r.serviceType}</td>
            <td>{STATUS_LABEL[r.status]}</td>
            <td>
              {r.status === "pending" ? (
                <>
                  <button onClick={() => alert("TODO: Edit form")}>Sửa</button>
                  <button onClick={() => handleCancel(r._id)}>Hủy</button>
                </>
              ) : (
                <button disabled>Sửa</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
