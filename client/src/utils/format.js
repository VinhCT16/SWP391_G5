// client/src/utils/format.js
export const pad2 = (n) => String(n).padStart(2, "0");

export const fmtDateTime24 = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const HH = pad2(d.getHours());
  const MM = pad2(d.getMinutes());
  return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
};

export const formatAddress = (a) => {
  if (!a) return "";
  const street   = a.street || "";
  const ward     = a.ward?.name || "";
  const district = a.district?.name || "";
  const province = a.province?.name || "";
  // Bỏ dấu phẩy thừa ở phần rỗng
  return [street, ward, district, province]
    .filter((x) => String(x).trim().length > 0)
    .join(", ");
};

export const statusVN = (s) =>
  ({
    PENDING_REVIEW: "Đang chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Bị từ chối",
    IN_PROGRESS: "Đang thực hiện",
    DONE: "Hoàn tất",
    CANCELLED: "Đã hủy",
  }[s] || s);
export function fmtNumber(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  return n.toLocaleString("vi-VN");  // format theo chuẩn Việt Nam
}