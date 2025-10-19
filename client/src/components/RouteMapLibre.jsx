import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

/**
 * Hiển thị MapLibre + vẽ tuyến đường GeoJSON (không có marker).
 * props:
 *  - routeGeojson: GeoJSON trả về từ ORS (nullable)
 *  - height: số px cho chiều cao map (mặc định 320)
 *  - (Các prop khác truyền vào sẽ bị bỏ qua)
 */
export default function RouteMapLibre({ routeGeojson, height = 320 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const lastFitKeyRef = useRef(""); // tránh fitBounds lặp lại
  const mtKey = process.env.REACT_APP_MAPTILER_KEY;

  // Khởi tạo map (luôn hiển thị)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const styleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${mtKey}`;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [105.8342, 21.0278], // Tâm Việt Nam
      zoom: 5,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      updateRoute(map, routeGeojson, lastFitKeyRef);
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật route khi prop thay đổi
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      map.once("load", () => updateRoute(map, routeGeojson, lastFitKeyRef));
    } else {
      updateRoute(map, routeGeojson, lastFitKeyRef);
    }
  }, [routeGeojson]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height, borderRadius: 8, overflow: "hidden" }}
    />
  );
}

function updateRoute(map, geo, lastFitKeyRef) {
  // Xoá route cũ (nếu có)
  if (map.getLayer("route-line")) map.removeLayer("route-line");
  if (map.getSource("route")) map.removeSource("route");

  if (!geo?.features?.[0]) return;

  map.addSource("route", { type: "geojson", data: geo });
  map.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    paint: {
      "line-width": 5,
      "line-opacity": 0.95,
    },
  });

  // Fit theo đường (một lần cho mỗi tuyến khác nhau)
  const coords = geo.features[0]?.geometry?.coordinates;
  if (!coords?.length) return;

  // flatten nếu MultiLineString
  const flat = Array.isArray(coords[0][0]) ? coords.flat() : coords;
  const key = hashCoords(flat);
  if (lastFitKeyRef.current === key) return;

  const bounds = flat.reduce(
    (b, [x, y]) => b.extend([x, y]),
    new maplibregl.LngLatBounds(flat[0], flat[0])
  );
  map.fitBounds(bounds, { padding: 50, duration: 400 });
  lastFitKeyRef.current = key;
}

function hashCoords(arr) {
  // tạo key nhẹ để nhận biết tuyến đã fit rồi (độ chính xác 1e-3)
  return arr.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("|");
}
