// server/src/utils/distance.js
import fetch from "node-fetch";

// Ưu tiên gọi API ORS để tính khoảng cách
export async function calcDistanceFromORS(origin, destination) {
  if (!origin || !destination) return null;

  const apiKey = process.env.ORS_API_KEY;
  const url = "https://api.openrouteservice.org/v2/directions/driving-car";

  const body = {
    coordinates: [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const json = await res.json();
  const summary = json.features[0].properties.summary;

  return {
    distanceKm: summary.distance / 1000,
    durationMin: summary.duration / 60,
  };
}

// Hàm dự phòng: tính khoảng cách xấp xỉ giữa 2 tọa độ (km)
export function haversineDistance(origin, destination) {
  const R = 6371; // bán kính Trái đất km
  const dLat = toRad(destination.lat - origin.lat);
  const dLon = toRad(destination.lng - origin.lng);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(destination.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(x) {
  return (x * Math.PI) / 180;
}
