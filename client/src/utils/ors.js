// client/src/utils/osm.js - OpenStreetMap services (miễn phí, không cần API key)

/**
 * 🗺️ Geocode với OSM Nominatim (miễn phí)
 * Tìm tọa độ từ địa chỉ - thử nhiều format và có fallback
 */
export async function osmGeocode(text, signal, opts = {}) {
  if (!text) return null;

  // Parse địa chỉ để thử nhiều format
  const addressParts = text.split(",").map(s => s.trim());
  const street = addressParts[0] || "";
  const ward = addressParts[1] || "";
  const district = addressParts[2] || "";
  const province = addressParts[3] || "";

  // Thử các format khác nhau từ cụ thể đến chung
  const queries = [
    text, // Format đầy đủ
    `${ward}, ${district}, ${province}`, // Bỏ số nhà
    `${district}, ${province}`, // Chỉ quận/huyện + tỉnh
    `${province}`, // Chỉ tỉnh
  ].filter(Boolean);

  for (const query of queries) {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", query);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "3"); // Lấy nhiều kết quả hơn
      url.searchParams.set("countrycodes", "vn");
      url.searchParams.set("addressdetails", "1");
      
      if (opts.focus?.lng && opts.focus?.lat) {
        url.searchParams.set("viewbox", `${opts.focus.lng - 0.2},${opts.focus.lat - 0.2},${opts.focus.lng + 0.2},${opts.focus.lat + 0.2}`);
        url.searchParams.set("bounded", "1");
      }

      const res = await fetch(url.toString(), {
        signal,
        headers: {
          "User-Agent": "SWP391_G5_MovingService/1.0",
          "Accept-Language": "vi",
        },
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      // Ưu tiên kết quả có type phù hợp (residential, building, etc.)
      const result = data.find(r => 
        r.type === "residential" || 
        r.type === "building" || 
        r.type === "house" ||
        r.type === "commercial"
      ) || data[0];

      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log(`✅ Geocoded: ${query} → [${lat}, ${lng}]`);
        return {
          lat,
          lng,
          label: result.display_name || query,
        };
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.warn("Nominatim geocode error for:", query, e.message);
      }
      continue;
    }
  }

  // Fallback: trả về tọa độ trung tâm của tỉnh nếu có
  if (opts.focus?.lat && opts.focus?.lng) {
    console.warn(`⚠️ Không tìm được địa chỉ "${text}", dùng tọa độ trung tâm`);
    return {
      lat: opts.focus.lat,
      lng: opts.focus.lng,
      label: `${province || "Địa điểm"} (ước tính)`,
    };
  }

  console.warn("❌ Không thể geocode:", text);
  return null;
}

/**
 * 🚗 Routing với OSRM (miễn phí, public server)
 * Tính tuyến đường lái xe giữa 2 điểm
 * Trả về khoảng cách, thời gian và GeoJSON route
 */
export async function osrmRoute(origin, dest, signal) {
  if (!origin || !dest) {
    console.warn("❌ osrmRoute thiếu dữ liệu");
    return null;
  }

  try {
    // OSRM public server: route-service.router.project-osrm.org
    // Format: /route/v1/{profile}/{coordinates}?overview=full&geometries=geojson
    const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=false`;
    
    const res = await fetch(url, {
      signal,
      headers: {
        "User-Agent": "SWP391_G5_MovingService/1.0",
      },
    });

    if (!res.ok) {
      const msg = await res.text();
      console.warn("OSRM route failed:", res.status, msg);
      // Fallback: tính khoảng cách đường chim bay
      return fallbackRoute(origin, dest);
    }

    const data = await res.json();
    
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.warn("OSRM route returned no route");
      return fallbackRoute(origin, dest);
    }

    const route = data.routes[0];
    const distance = route.distance || 0; // meters
    const duration = route.duration || 0; // seconds
    const geometry = route.geometry;

    console.log(`✅ OSRM: ${(distance / 1000).toFixed(2)} km • ${(duration / 60).toFixed(1)} phút`);

    // Convert OSRM geometry to GeoJSON FeatureCollection
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            summary: {
              distance,
              duration,
            },
          },
          geometry: {
            type: "LineString",
            coordinates: geometry.coordinates || [],
          },
        },
      ],
    };

    return {
      geojson,
      summary: {
        distance, // meters
        duration, // seconds
      },
    };
  } catch (e) {
    if (e?.name !== "AbortError") {
      console.warn("OSRM route error:", e.message);
    }
    return fallbackRoute(origin, dest);
  }
}

/**
 * Fallback: tính khoảng cách đường chim bay khi OSRM không có route
 */
function fallbackRoute(origin, dest) {
  // Haversine distance
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(dest.lat - origin.lat);
  const dLon = toRad(dest.lng - origin.lng);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(dest.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // meters

  // Estimate duration: ~30 km/h average in city, ~60 km/h on highway
  // Use weighted average: 40 km/h
  const duration = (distance / 1000 / 40) * 3600; // seconds

  return {
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            summary: { distance, duration },
          },
          geometry: {
            type: "LineString",
            coordinates: [[origin.lng, origin.lat], [dest.lng, dest.lat]],
          },
        },
      ],
    },
    summary: { distance, duration },
  };
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

// Export để backward compatibility (tên cũ)
export const orsGeocode = osmGeocode;
export const orsDirections = osrmRoute;