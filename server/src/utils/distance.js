// server/src/utils/distance.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const ORS_KEY = process.env.ORS_API_KEY;

/** Gọi ORS để lấy khoảng cách lái xe (đơn vị km) */
export async function calcDistanceFromORS(origin, dest) {
  if (!ORS_KEY) {
    console.warn("⚠️ Không có ORS_API_KEY");
    return null;
  }

  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [dest.lng, dest.lat],
        ],
      }),
    });
    if (!res.ok) {
      console.warn("❌ ORS distance failed:", res.status);
      return null;
    }

    const data = await res.json();
    const summary = data?.features?.[0]?.properties?.summary;
    return {
      distanceKm: summary?.distance / 1000,
      durationMin: summary?.duration / 60,
    };
  } catch (e) {
    console.error("calcDistanceFromORS error:", e);
    return null;
  }
}

/** Fallback: khoảng cách đường chim bay */
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
