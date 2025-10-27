import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";

// Fix icon khi chạy CRA/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:  require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl:        require("leaflet/dist/images/marker-icon.png"),
  shadowUrl:      require("leaflet/dist/images/marker-shadow.png"),
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function ResizeOnMount() {
  const map = useMapEvents({});
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapPicker({ value, onChange, zoom = 14, height = 320 }) {
  const center = useMemo(
    () => [value?.lat ?? 21.0278, value?.lng ?? 105.8342], // Hà Nội
    [value]
  );

  // Khung có chiều cao cố định + map fill toàn bộ
  const wrapStyle = {
    width: "100%",
    maxWidth: 820,
    height,
    border: "1px solid #ddd",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  };

  return (
    <div style={wrapStyle}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <ResizeOnMount />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {typeof value?.lat === "number" && typeof value?.lng === "number" && (
          <Marker
            draggable
            position={[value.lat, value.lng]}
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onChange?.({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
        <ClickHandler onPick={(ll) => onChange?.(ll)} />
      </MapContainer>
    </div>
  );
}
