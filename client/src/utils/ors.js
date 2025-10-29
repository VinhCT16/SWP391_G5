// client/src/utils/ors.js
const ORS_KEY = process.env.REACT_APP_ORS_API_KEY;
const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;

// Debug API keys
console.log("🔑 API Keys check:", {
  ORS_KEY: ORS_KEY ? "✅ Set" : "❌ Missing",
  MAPTILER_KEY: MAPTILER_KEY ? "✅ Set" : "❌ Missing"
});

/**
 * 🗺️ Geocode (ổn định tại Việt Nam)
 * Ưu tiên MapTiler → fallback sang ORS.
 */
export async function orsGeocode(text, signal, opts = {}) {
  if (!text) return null;

  // --- MapTiler (ưu tiên cho Việt Nam, độ chính xác cao) ---
  if (MAPTILER_KEY) {
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
  } else {
    console.warn("⚠️ MapTiler key missing, skipping MapTiler geocoding");
  }

  // --- Fallback sang OpenRouteService ---
  if (ORS_KEY) {
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
    }
  } else {
    console.warn("⚠️ ORS key missing, cannot geocode");
  }

  // Fallback: return mock coordinates for Hanoi if no API keys
  console.warn("⚠️ No API keys available, using mock coordinates");
  return { lat: 21.0278, lng: 105.8342, label: "Mock location" };
}

/**
 * 🚗 Directions (ORS)
 * Tính tuyến đường lái xe giữa 2 điểm (trả về khoảng cách & thời gian)
 */
export async function orsDirections(origin, dest, signal) {
  if (!origin || !dest) {
    console.warn("❌ orsDirections thiếu dữ liệu");
    return null;
  }

  if (!ORS_KEY) {
    console.warn("⚠️ ORS key missing, using mock route");
    // Mock route data for testing
    const mockDistance = Math.sqrt(
      Math.pow(origin.lng - dest.lng, 2) + Math.pow(origin.lat - dest.lat, 2)
    ) * 111; // Rough km conversion
    const mockDuration = mockDistance * 2; // 2 minutes per km
    
    return {
      geojson: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [[origin.lng, origin.lat], [dest.lng, dest.lat]]
          },
          properties: {
            summary: {
              distance: mockDistance * 1000, // meters
              duration: mockDuration * 60 // seconds
            }
          }
        }]
      },
      summary: { 
        distance: mockDistance * 1000, 
        duration: mockDuration * 60 
      },
    };
  }

  try {
    // ✅ Key bắt buộc nằm trong query string, body cần đúng format
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_KEY}`;

    // Trước khi gọi directions, snap 2 điểm về đường gần nhất để tránh lỗi 2010
    const snap = async (pt) => {
      try {
        const snapUrl = `https://api.openrouteservice.org/v2/snap/driving-car?api_key=${ORS_KEY}`;
        const r = await fetch(snapUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({ coordinates: [[pt.lng, pt.lat]] }),
        });
        if (!r.ok) throw new Error("snap failed " + r.status);
        const data = await r.json();
        const coord = data?.features?.[0]?.geometry?.coordinates;
        if (Array.isArray(coord) && coord.length === 2) {
          return { lng: coord[0], lat: coord[1] };
        }
      } catch (e) {
        console.warn("snap error", e.message);
      }
      return pt; // fallback không snap
    };

    const o2 = await snap(origin);
    const d2 = await snap(dest);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        coordinates: [
          [o2.lng, o2.lat],
          [d2.lng, d2.lat],
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
      // Fallback to straight line mock when ORS cannot find routable point
      const mockDistance = Math.sqrt(
        Math.pow(origin.lng - dest.lng, 2) + Math.pow(origin.lat - dest.lat, 2)
      ) * 111;
      const mockDuration = mockDistance * 2;
      return {
        geojson: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [[origin.lng, origin.lat], [dest.lng, dest.lat]]
            },
            properties: {
              summary: {
                distance: mockDistance * 1000,
                duration: mockDuration * 60
              }
            }
          }]
        },
        summary: { distance: mockDistance * 1000, duration: mockDuration * 60 },
      };
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
    // Fallback straight line on error
    const mockDistance = Math.sqrt(
      Math.pow(origin.lng - dest.lng, 2) + Math.pow(origin.lat - dest.lat, 2)
    ) * 111;
    const mockDuration = mockDistance * 2;
    return {
      geojson: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: { type: "LineString", coordinates: [[origin.lng, origin.lat], [dest.lng, dest.lat]] },
          properties: { summary: { distance: mockDistance * 1000, duration: mockDuration * 60 } }
        }]
      },
      summary: { distance: mockDistance * 1000, duration: mockDuration * 60 },
    };
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
