// server/src/utils/distance.js - OpenStreetMap OSRM (miễn phí, không cần API key)
import fetch from "node-fetch";

/**
 * Gọi OSRM để lấy khoảng cách lái xe (đơn vị km) + geometry
 * OSRM public server: router.project-osrm.org (miễn phí)
 */
export async function calcDistanceFromORS(origin, dest) {
  try {
    // OSRM public server - không cần API key
    const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=false`;
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SWP391_G5_MovingService/1.0",
      },
    });

    if (!res.ok) {
      console.warn("❌ OSRM route failed:", res.status);
      // Fallback to haversine on API failure
      return fallbackDistance(origin, dest);
    }

    const data = await res.json();
    
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.warn("❌ OSRM route returned no route");
      return fallbackDistance(origin, dest);
    }

    const route = data.routes[0];
    const distance = route.distance || 0; // meters
    const duration = route.duration || 0; // seconds
    const geometry = route.geometry;

    console.log(`✅ OSRM: ${(distance / 1000).toFixed(2)} km • ${(duration / 60).toFixed(1)} phút`);

    // Convert to GeoJSON FeatureCollection
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
      distanceKm: distance / 1000,
      durationMin: duration / 60,
      geojson,
    };
  } catch (e) {
    console.error("calcDistanceFromORS error:", e);
    // Fallback to haversine on error
    return fallbackDistance(origin, dest);
  }
}

/**
 * Fallback: tính khoảng cách đường chim bay khi OSRM không có route
 */
function fallbackDistance(origin, dest) {
  const distanceKm = haversineDistance(origin, dest);
  // Estimate: ~40 km/h average speed
  const durationMin = (distanceKm / 40) * 60;
  
  return {
    distanceKm,
    durationMin,
    geojson: toLineGeoJSON(origin, dest),
  };
}

/** Fallback: khoảng cách đường chim bay (Haversine) */
export function haversineDistance(a, b) {
  const R = 6371; // bán kính trái đất (km)
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toLineGeoJSON(a, b) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [a.lng, a.lat],
            [b.lng, b.lat]
          ],
        },
      },
    ],
  };
}