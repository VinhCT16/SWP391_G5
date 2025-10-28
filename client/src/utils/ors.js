// client/src/utils/ors.js
const ORS_KEY = process.env.REACT_APP_ORS_API_KEY;
const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;

/**
 * 🗺️ Geocode (ổn định tại Việt Nam)
 * Ưu tiên MapTiler → fallback sang ORS.
 */
export async function orsGeocode(text, signal, opts = {}) {
  if (!text) return null;

  // --- MapTiler (ưu tiên cho Việt Nam, độ chính xác cao) ---
  try {
    const mtUrl = new URL(
      "https://api.maptiler.com/geocoding/" + encodeURIComponent(text) + ".json"
    );
    mtUrl.searchParams.set("key", MAPTILER_KEY);
    mtUrl.searchParams.set("country", "VN");
    if (opts.focus?.lng && opts.focus?.lat)
      mtUrl.searchParams.set("proximity", `${opts.focus.lng},${opts.focus.lat}`);

    const res = await fetch(mtUrl, { signal });
    if (!res.ok) throw new Error("MapTiler geocode failed " + res.status);

    const data = await res.json();
    const feat = data?.features?.[0];
    if (!feat) throw new Error("No MapTiler result");
    const [lng, lat] = feat.geometry.coordinates;
    return { lat, lng, label: feat.place_name || feat.text };
  } catch (e) {
    if (e?.name !== "AbortError")
      console.warn("MapTiler geocode error → fallback to ORS:", e.message);
  }

  // --- Fallback sang OpenRouteService ---
  try {
    const url = new URL("https://api.openrouteservice.org/geocode/search");
    url.searchParams.set("api_key", ORS_KEY);
    url.searchParams.set("text", text);
    url.searchParams.set("boundary.country", "VN");
    url.searchParams.set("size", "1");
    url.searchParams.set("sources", "osm");

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error("ORS geocode failed " + res.status);

    const data = await res.json();
    const feat = data?.features?.[0];
    if (!feat) return null;
    const [lng, lat] = feat.geometry.coordinates;
    return { lat, lng, label: feat.properties?.label };
  } catch (e) {
    if (e?.name !== "AbortError") console.warn("ORS geocode error:", e.message);
    return null;
  }
}

/**
 * 🚗 Directions (ORS)
 * Tính tuyến đường lái xe giữa 2 điểm (trả về khoảng cách & thời gian)
 */
export async function orsDirections(origin, dest, signal) {
  if (!origin || !dest || !ORS_KEY) {
    console.warn("❌ orsDirections thiếu dữ liệu hoặc key");
    return null;
  }

  try {
    // ✅ Key bắt buộc nằm trong query string, body cần đúng format
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [dest.lng, dest.lat],
        ],
        language: "vi",
        preference: "recommended",
        units: "m",
        instructions: false,
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      console.warn("ORS directions failed:", res.status, msg);
      return null;
    }

    const data = await res.json();
    const feature = data?.features?.[0];
    const summary = feature?.properties?.summary || {};

    const distance = summary.distance || 0;
    const duration = summary.duration || 0;

    console.log(`✅ ORS: ${(distance / 1000).toFixed(2)} km • ${(duration / 60).toFixed(1)} phút`);

    return {
      geojson: data,
      summary: { distance, duration },
    };
  } catch (e) {
    if (e?.name !== "AbortError") console.warn("orsDirections error:", e.message);
    return null;
  }
}

/**
 * 📍 Chuỗi địa chỉ
 */
export function joinAddress(addr) {
  if (!addr) return "";
  return [
    addr.street?.trim(),
    addr.ward?.name,
    addr.district?.name,
    addr.province?.name,
    "Việt Nam",
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * ✅ Kiểm tra địa chỉ đủ 4 cấp chưa
 */
export function isAddressComplete(a) {
  return !!(
    a?.province?.code &&
    a?.district?.code &&
    a?.ward?.code &&
    String(a?.street || "").trim()
  );
}
