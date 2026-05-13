"use client";

import dynamic from "next/dynamic";
import type { TableLocation } from "@/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-surface flex items-center justify-center" style={{ height: 380 }}>
      <p className="text-muted text-sm">Зареждане на картата...</p>
    </div>
  ),
});

interface MapClientProps {
  locations: TableLocation[];
  center: [number, number];
  zoom: number;
}

export default function MapClient({ locations, center, zoom }: MapClientProps) {
  return <LeafletMap locations={locations} center={center} zoom={zoom} />;
}
