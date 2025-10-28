// client/src/utils/datetime.js
export function fmtDateTime24(value) {
  if (!value) return "-";
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("vi-VN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
// client/src/utils/datetime.js (thêm)
export function nowForDatetimeLocal() {
  const now = new Date();
  // chuyển sang “local ISO” để không lệch múi giờ
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}
