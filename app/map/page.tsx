"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/BottomNav";
import MapClient from "@/components/MapClient";
import { BG_CITIES, CITY_COORDS } from "@/types";
import type { TableLocation } from "@/types";
import { Loader2, MapPin } from "lucide-react";

const DEFAULT_CITY = "София";
const DEFAULT_CENTER: [number, number] = CITY_COORDS[DEFAULT_CITY];
const DEFAULT_ZOOM = 13;

// ~30 km bounding box in degrees
function isNearCity(loc: TableLocation, center: [number, number]): boolean {
  return Math.abs(loc.lat - center[0]) < 0.27 && Math.abs(loc.lng - center[1]) < 0.35;
}

export default function MapPage() {
  const supabase = createClient();
  const [locations, setLocations] = useState<TableLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);

  useEffect(() => {
    supabase
      .from("table_locations")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setLocations((data ?? []) as TableLocation[]);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const center = CITY_COORDS[selectedCity] ?? DEFAULT_CENTER;

  // Filter list to locations near selected city
  const visibleLocations = locations.filter(loc => isNearCity(loc, center));
  const availableCount = visibleLocations.filter(l => l.is_available).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">
          🗺️ Карта с <span className="text-primary">маси</span>
        </h1>

        {/* City dropdown */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2 flex-1">
            <MapPin size={15} className="text-primary flex-shrink-0" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-primary transition-colors"
            >
              {BG_CITIES.map(city => (
                <option key={city} value={city} className="bg-card">{city}</option>
              ))}
            </select>
          </div>
          <span className="text-muted text-sm flex-shrink-0">
            {loading ? "—" : `${availableCount} свободни`}
          </span>
        </div>
      </header>

      {/* Map */}
      <div className="mx-4 rounded-2xl overflow-hidden border border-border">
        {loading ? (
          <div className="flex items-center justify-center bg-surface" style={{ height: 380 }}>
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <MapClient locations={visibleLocations} center={center} zoom={DEFAULT_ZOOM} />
        )}
      </div>

      {/* Location list */}
      <div className="px-4 pt-4 pb-28 space-y-3">
        {!loading && visibleLocations.length === 0 && (
          <div className="text-center py-10 space-y-2">
            <p className="text-4xl">🏓</p>
            <p className="text-white font-semibold">Няма маси в {selectedCity}</p>
            <p className="text-muted text-sm">Избери друг град от менюто</p>
          </div>
        )}

        {visibleLocations.map(loc => (
          <div
            key={loc.id}
            className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-white">{loc.name}</p>
              {loc.address && (
                <p className="text-sm text-muted mt-0.5">{loc.address}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                {loc.opening_hours && <span>🕐 {loc.opening_hours}</span>}
                {loc.price_per_hour && <span>💰 {loc.price_per_hour} лв/ч</span>}
                <span>🏓 {loc.tables_count} маси</span>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                loc.is_available
                  ? "bg-primary/15 text-primary"
                  : "bg-danger/15 text-danger"
              }`}
            >
              {loc.is_available ? "Свободно" : "Заето"}
            </span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
