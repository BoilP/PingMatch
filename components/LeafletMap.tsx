"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { TableLocation } from "@/types";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconAvailable = L.divIcon({
  html: `<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px #22c55e"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

const iconUnavailable = L.divIcon({
  html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px #ef4444"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

interface LeafletMapProps {
  locations: TableLocation[];
}

export default function LeafletMap({ locations }: LeafletMapProps) {
  // Sofia center
  const center: [number, number] = [42.6977, 23.3219];

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ width: "100%", height: "380px" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={loc.is_available ? iconAvailable : iconUnavailable}
        >
          <Popup>
            <div className="text-sm min-w-[160px]">
              <strong>{loc.name}</strong>
              {loc.address && <p className="text-gray-600 mt-0.5">{loc.address}</p>}
              <p
                className={`mt-1 font-semibold ${
                  loc.is_available ? "text-green-600" : "text-red-500"
                }`}
              >
                {loc.is_available ? "✅ Свободно" : "❌ Заето"}
              </p>
              {loc.opening_hours && (
                <p className="text-gray-500 text-xs mt-0.5">
                  🕐 {loc.opening_hours}
                </p>
              )}
              {loc.price_per_hour && (
                <p className="text-gray-500 text-xs">
                  💰 {loc.price_per_hour} лв/ч
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
