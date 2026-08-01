"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

type Pin = {
  id: string;
  displayName: string;
  profileKind: "individual" | "business";
  role: "buyer" | "seller" | "both";
  category: string;
  headline: string | null;
  isVerified: boolean;
  city: string | null;
  state: string | null;
  country: string | null;
  lat: number;
  lng: number;
  hasOpenRequest: boolean;
  hasActiveOffer: boolean;
};

type Cluster = {
  key: string;
  lat: number;
  lng: number;
  pins: Pin[];
};

type ProfilePreview = {
  profile: any;
  requests: any[];
  offers: any[];
};

const ROLE_COLOR: Record<string, string> = {
  buyer: "#f97316", // orange
  seller: "#4f46e5", // indigo
  both: "#9333ea", // purple
};

const ROLE_ICON: Record<string, string> = {
  buyer: "🔍",
  seller: "🏢",
  both: "🔁",
};

function pinDivIcon(pin: Pin) {
  const color = ROLE_COLOR[pin.role] ?? "#64748b";
  const badge = pin.isVerified ? `<span style="position:absolute;top:-4px;right:-4px;background:#22c55e;border:2px solid white;width:10px;height:10px;border-radius:50%;"></span>` : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:${color};border:2px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,.4);font-size:14px;">${ROLE_ICON[pin.role] ?? "•"}${badge}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function clusterDivIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#1e293b;color:white;border:3px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,.4);font-weight:600;font-size:13px;">${count}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// Grid-based clustering: group pins whose coordinates round to the same cell.
// Cell size shrinks as zoom increases so clusters break apart on zoom-in.
function clusterPins(pins: Pin[], zoom: number): Cluster[] {
  const cellSize = Math.max(0.5 / Math.pow(1.6, zoom - 3), 0.001);
  const groups = new Map<string, Pin[]>();
  for (const pin of pins) {
    const key = `${Math.round(pin.lat / cellSize)}:${Math.round(pin.lng / cellSize)}`;
    const arr = groups.get(key);
    if (arr) arr.push(pin);
    else groups.set(key, [pin]);
  }
  return Array.from(groups.entries()).map(([key, groupPins]) => ({
    key,
    lat: groupPins.reduce((s, p) => s + p.lat, 0) / groupPins.length,
    lng: groupPins.reduce((s, p) => s + p.lng, 0) / groupPins.length,
    pins: groupPins,
  }));
}

function BoundsWatcher({ onChange }: { onChange: (bounds: L.LatLngBounds, zoom: number) => void }) {
  const map = useMapEvents({
    moveend: () => onChange(map.getBounds(), map.getZoom()),
    zoomend: () => onChange(map.getBounds(), map.getZoom()),
  });
  useEffect(() => {
    onChange(map.getBounds(), map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function MapView() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [zoom, setZoom] = useState(11);
  const [viewMode, setViewMode] = useState<"map" | "list" | "split">("split");
  const [role, setRole] = useState<string>("any");
  const [category, setCategory] = useState<string>("any");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProfilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);

  const fetchPins = useCallback(
    async (bounds: L.LatLngBounds) => {
      const params = new URLSearchParams({
        west: String(bounds.getWest()),
        south: String(bounds.getSouth()),
        east: String(bounds.getEast()),
        north: String(bounds.getNorth()),
      });
      if (role !== "any") params.set("role", role);
      if (category !== "any") params.set("category", category);
      if (q) params.set("q", q);
      const res = await fetch(`/api/map/pins?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setPins(data.pins);
    },
    [role, category, q]
  );

  const onBoundsChange = useCallback(
    (bounds: L.LatLngBounds, z: number) => {
      boundsRef.current = bounds;
      setZoom(z);
      fetchPins(bounds);
    },
    [fetchPins]
  );

  // Re-fetch when filters change, using the last known bounds.
  useEffect(() => {
    if (boundsRef.current) fetchPins(boundsRef.current);
  }, [fetchPins]);

  const clusters = useMemo(() => clusterPins(pins, zoom), [pins, zoom]);

  async function openPin(pinId: string) {
    setSelectedId(pinId);
    setPreviewLoading(true);
    setPreview(null);
    setMessageDraft("");
    setSendResult(null);
    const res = await fetch(`/api/map/profile/${pinId}`);
    setPreviewLoading(false);
    if (res.ok) setPreview(await res.json());
  }

  async function sendIntro() {
    if (!selectedId || !messageDraft.trim()) return;
    setSendingMessage(true);
    setSendResult(null);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientProfileId: selectedId, firstMessage: messageDraft }),
    });
    setSendingMessage(false);
    if (res.ok) {
      setSendResult("Message sent! Check your Messages tab.");
      setMessageDraft("");
    } else {
      const data = await res.json().catch(() => ({}));
      setSendResult(data.error === "Not authenticated" ? "Log in to send a message." : data.error || "Failed to send");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <input
          placeholder="Search businesses, needs, categories..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="any">Buyers & Sellers</option>
          <option value="seller">Sellers only</option>
          <option value="buyer">Buyers only</option>
          <option value="both">Buyer & Seller</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="any">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="ml-auto flex overflow-hidden rounded-lg border border-slate-300 text-sm">
          {(["map", "split", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 capitalize ${viewMode === v ? "bg-indigo-600 text-white" : "bg-white text-slate-600"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* List panel */}
        {viewMode !== "map" && (
          <div className={`overflow-y-auto border-r border-slate-200 bg-white ${viewMode === "split" ? "w-80" : "w-full"}`}>
            {pins.length === 0 && (
              <p className="p-4 text-sm text-slate-500">No pins in this area yet. Try zooming out or panning the map.</p>
            )}
            {pins.map((pin) => (
              <button
                key={pin.id}
                onClick={() => openPin(pin.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${selectedId === pin.id ? "bg-indigo-50" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs text-white"
                    style={{ background: ROLE_COLOR[pin.role] }}
                  >
                    {ROLE_ICON[pin.role]}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-900">{pin.displayName}</span>
                  {pin.isVerified && <span className="text-xs text-emerald-600">✓</span>}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{pin.category}{pin.city ? ` · ${pin.city}` : ""}</p>
                {pin.headline && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{pin.headline}</p>}
              </button>
            ))}
          </div>
        )}

        {/* Map panel */}
        {viewMode !== "list" && (
          <div className="relative flex-1">
            <MapContainer center={[39.8283, -98.5795]} zoom={4} className="h-full w-full">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <BoundsWatcher onChange={onBoundsChange} />
              {clusters.map((c) =>
                c.pins.length === 1 ? (
                  <Marker
                    key={c.key}
                    position={[c.lat, c.lng]}
                    icon={pinDivIcon(c.pins[0])}
                    eventHandlers={{ click: () => openPin(c.pins[0].id) }}
                  />
                ) : (
                  <Marker
                    key={c.key}
                    position={[c.lat, c.lng]}
                    icon={clusterDivIcon(c.pins.length)}
                    eventHandlers={{
                      click: (e) => {
                        e.target._map.setView([c.lat, c.lng], Math.min(zoom + 2, 18));
                      },
                    }}
                  />
                )
              )}
            </MapContainer>
          </div>
        )}

        {/* Preview drawer */}
        {selectedId && (
          <div className="w-96 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-5">
            <button onClick={() => setSelectedId(null)} className="text-sm text-slate-400 hover:text-slate-700">
              Close ✕
            </button>
            {previewLoading && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
            {preview && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{preview.profile.displayName}</h2>
                  {preview.profile.isVerified && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {preview.profile.category}
                  {preview.profile.city ? ` · ${preview.profile.city}${preview.profile.state ? `, ${preview.profile.state}` : ""}` : ""}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  {preview.profile.profileKind} · {preview.profile.role === "both" ? "Buyer & Seller" : preview.profile.role}
                </p>

                {preview.profile.headline && <p className="mt-3 text-sm font-medium text-slate-800">{preview.profile.headline}</p>}
                {preview.profile.description && <p className="mt-2 text-sm text-slate-600">{preview.profile.description}</p>}

                {preview.requests.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open requests</h3>
                    {preview.requests.map((r: any) => (
                      <div key={r.id} className="mt-2 rounded-lg border border-slate-200 p-2">
                        <p className="text-sm font-medium text-slate-800">{r.title}</p>
                        <p className="text-xs text-slate-500">{r.category} · {r.urgency}</p>
                      </div>
                    ))}
                  </div>
                )}

                {preview.offers.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active offers</h3>
                    {preview.offers.map((o: any) => (
                      <div key={o.id} className="mt-2 rounded-lg border border-slate-200 p-2">
                        <p className="text-sm font-medium text-slate-800">{o.title}</p>
                        <p className="text-xs text-slate-500">{o.category}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href={`/profile/${preview.profile.id}`}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View full profile
                  </Link>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Send a message
                  </label>
                  <textarea
                    rows={3}
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    placeholder={`Hi ${preview.profile.displayName}, I'd like to talk about...`}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={sendIntro}
                    disabled={sendingMessage || !messageDraft.trim()}
                    className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {sendingMessage ? "Sending..." : "Send message"}
                  </button>
                  {sendResult && <p className="mt-2 text-xs text-slate-600">{sendResult}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
