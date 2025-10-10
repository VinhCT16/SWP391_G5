// Gộp object address {province, district, ward, street} -> string hiển thị
export const fmtAddress = (a) => {
  if (!a) return "";
  const parts = [
    a.street,
    a.ward?.name,
    a.district?.name,
    a.province?.name,
  ].filter(Boolean);
  return parts.join(", ");
};
