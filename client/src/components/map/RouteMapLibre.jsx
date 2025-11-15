import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

/**
 * Hiển thị MapLibre + vẽ tuyến đường GeoJSON với OpenStreetMap tiles.
 * props:
 *  - routeGeojson: GeoJSON trả về từ OSRM (nullable)
 *  - height: số px cho chiều cao map (mặc định 320)
 *  - pickup: {lat, lng} - điểm lấy hàng (optional, để hiển thị marker)
 *  - delivery: {lat, lng} - điểm giao hàng (optional, để hiển thị marker)
 */
export default function RouteMapLibre({ routeGeojson, height = 320, pickup, delivery }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const lastFitKeyRef = useRef(""); // tránh fitBounds lặp lại

  // Khởi tạo map (luôn hiển thị)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Sử dụng OpenStreetMap tiles (miễn phí, không cần API key)
    const styleUrl = {
      version: 8,
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png?"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "osm-tiles",
          type: "raster",
          source: "osm-tiles",
        },
      ],
    };

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
      updateMarkers(map, pickup, delivery);
    });

    map.on("error", (e) => {
      console.error("Map error:", e);
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật route khi prop thay đổi
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      map.once("load", () => {
        updateRoute(map, routeGeojson, lastFitKeyRef);
        updateMarkers(map, pickup, delivery);
      });
    } else {
      updateRoute(map, routeGeojson, lastFitKeyRef);
      updateMarkers(map, pickup, delivery);
    }
  }, [routeGeojson, pickup, delivery]);

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

function updateMarkers(map, pickup, delivery) {
  // Xóa markers cũ
  if (map.getLayer("pickup-marker")) map.removeLayer("pickup-marker");
  if (map.getSource("pickup-marker")) map.removeSource("pickup-marker");
  if (map.getLayer("delivery-marker")) map.removeLayer("delivery-marker");
  if (map.getSource("delivery-marker")) map.removeSource("delivery-marker");

  // Thêm pickup marker
  if (pickup?.lat && pickup?.lng) {
    map.addSource("pickup-marker", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [pickup.lng, pickup.lat],
        },
      },
    });
    map.addLayer({
      id: "pickup-marker",
      type: "circle",
      source: "pickup-marker",
      paint: {
        "circle-radius": 8,
        "circle-color": "#00ff00",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  // Thêm delivery marker
  if (delivery?.lat && delivery?.lng) {
    map.addSource("delivery-marker", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [delivery.lng, delivery.lat],
        },
      },
    });
    map.addLayer({
      id: "delivery-marker",
      type: "circle",
      source: "delivery-marker",
      paint: {
        "circle-radius": 8,
        "circle-color": "#ff0000",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }
}
