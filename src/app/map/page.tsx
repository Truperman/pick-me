"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so the map must be a client-only component,
// and `ssr: false` requires this file itself to be a Client Component.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
      Loading map...
    </div>
  ),
});

export default function MapPage() {
  return <MapView />;
}
