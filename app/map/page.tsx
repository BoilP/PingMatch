import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import MapClient from "@/components/MapClient";
import type { TableLocation } from "@/types";

export default async function MapPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("table_locations")
    .select("*")
    .order("name");

  const locations = (data ?? []) as TableLocation[];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">
          🗺️ Карта с <span className="text-primary">маси</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          {locations.filter((l) => l.is_available).length} свободни
          локации в момента
        </p>
      </header>

      {/* Map fills the rest of the screen */}
      <div className="mx-4 rounded-2xl overflow-hidden border border-border">
        <MapClient locations={locations} />
      </div>

      {/* Location list */}
      <div className="px-4 pt-4 pb-28 space-y-3">
        {locations.map((loc) => (
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
                {loc.price_per_hour && (
                  <span>💰 {loc.price_per_hour} лв/ч</span>
                )}
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
