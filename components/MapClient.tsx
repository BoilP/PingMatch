"use client";

import dynamic from "next/dynamic";
import type { TableLocation } from "@/types";

// Leaflet must be loaded client-side only
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface flex items-center justify-center">
      <p className="text-muted">Зареждане на картата...</p>
    </div>
  ),
});

interface MapClientProps {
  locations: TableLocation[];
}

export default function MapClient({ locations }: MapClientProps) {
  return <LeafletMap locations={locations} />;
}
