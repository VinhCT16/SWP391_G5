// client/src/utils/ors.js
const ORS_KEY = process.env.REACT_APP_ORS_API_KEY;

/**
 * Geocode: text -> {lat, lng}
 * opts: { focus: {lat, lng} }   // bias về tỉnh/thành đang chọn
 */
export async function orsGeocode(text, signal, opts = {}) {
  if (!text || !ORS_KEY) return null;
  try {
    const url = new URL("https://api.openrouteservice.org/geocode/search");
    url.searchParams.set("api_key", ORS_KEY);
    url.searchParams.set("text", text);
    url.searchParams.set("size", "1");
    url.searchParams.set("layers", "address,street,venue");        // ưu tiên địa chỉ chi tiết
    url.searchParams.set("sources", "osm,wof");                    // nguồn dữ liệu
    url.searchParams.set("boundary.country", "VN");                // chỉ trong VN

    // Giới hạn trong bbox Việt Nam để tránh nhảy ra Ấn Độ Dương
    // VN approx: (min_lon, min_lat, max_lon, max_lat)
    url.searchParams.set("boundary.rect.min_lon", "102.0");
    url.searchParams.set("boundary.rect.min_lat", "8.0");
    url.searchParams.set("boundary.rect.max_lon", "110.0");
    url.searchParams.set("boundary.rect.max_lat", "24.5");

    // Bias theo tỉnh/thành đang chọn (nếu có)
    if (opts.focus?.lat && opts.focus?.lng) {
      url.searchParams.set("focus.point.lat", String(opts.focus.lat));
      url.searchParams.set("focus.point.lon", String(opts.focus.lng));
    }

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data?.features?.[0];
    const [lng, lat] = feat?.geometry?.coordinates || [];
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, label: feat?.properties?.label };
    }
    return null;
  } catch (e) {
    if (e?.name === "AbortError") return null; // bỏ qua AbortError
    console.warn("orsGeocode error:", e);
    return null;
  }
}

/**
 * Directions: origin/dest -> { geojson, summary }
 */
export async function orsDirections(origin, dest, signal) {
  if (!origin || !dest || !ORS_KEY) return null;
  try {
    const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": ORS_KEY,
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [dest.lng, dest.lat],
        ],
      }),
    });
    if (!res.ok) return null;
    const geo = await res.json();
    const feature = geo?.features?.[0];
    const summary = feature?.properties?.summary || null;
    return { geojson: geo, summary };
  } catch (e) {
    if (e?.name === "AbortError") return null;
    console.warn("orsDirections error:", e);
    return null;
  }
}

// Ghép chuỗi địa chỉ từ AddressPicker của bạn
export function joinAddress(addr) {
  if (!addr) return "";
  const parts = [
    (addr.street || "").trim(),
    addr.ward?.name,
    addr.district?.name,
    addr.province?.name,
    "Việt Nam",
  ].filter(Boolean);
  return parts.join(", ");
}

export function isAddressComplete(a) {
  return !!(a?.province?.code && a?.district?.code && a?.ward?.code && String(a?.street||"").trim());
}
