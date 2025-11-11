export function normalizeVNPhone(input = "") {
  const s = String(input).trim().replace(/\s+/g, "");
  if (s.startsWith("+84")) return "0" + s.slice(3);
  return s;
}

export function isValidVNMobile(phone = "") {
  const p = normalizeVNPhone(phone);
  return /^0(3|5|7|8|9)\d{8}$/.test(p);
}

export function validateMovingTime(movingTimeISO) {
  if (!movingTimeISO) return { ok: false, msg: "Vui lòng chọn thời gian chuyển nhà." };

  const now = new Date();
  const sel = new Date(movingTimeISO);
  if (isNaN(sel.getTime())) return { ok: false, msg: "Thời gian không hợp lệ." };
  if (sel.getTime() <= now.getTime()) return { ok: false, msg: "Thời gian phải ở tương lai." };

  const sameDay =
    now.getFullYear() === sel.getFullYear() &&
    now.getMonth() === sel.getMonth() &&
    now.getDate() === sel.getDate();

  if (sameDay) {
    const noon = new Date(now);
    noon.setHours(12, 0, 0, 0);
    if (now < noon) {
      if (sel.getHours() < 12) {
        return { ok: false, msg: "Trước 12h trưa chỉ được đặt từ 12:00 trở đi." };
      }
    } else {
      return { ok: false, msg: "Sau 12h trưa hôm nay, hãy đặt từ ngày mai." };
    }
  }

  return { ok: true, msg: "" };
}
