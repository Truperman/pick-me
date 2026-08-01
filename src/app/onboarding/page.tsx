"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const [profileKind, setProfileKind] = useState<"individual" | "business">("business");
  const [role, setRole] = useState<"buyer" | "seller" | "both">("seller");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("United States");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(25);
  const [visibilityLevel, setVisibilityLevel] = useState<"exact" | "approximate" | "city_only" | "hidden">(
    "approximate"
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function useMyLocation() {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser doesn't support geolocation. Enter coordinates manually.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Location permission denied. Enter coordinates manually below.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!coords) {
      setError("Set a location first — use 'Use my location' or enter coordinates.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileKind,
        role,
        displayName,
        category,
        headline,
        description,
        lat: coords.lat,
        lng: coords.lng,
        city,
        state,
        country,
        serviceRadiusKm,
        visibilityLevel,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
      return;
    }
    router.push("/map");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Set up your map profile</h1>
      <p className="mt-1 text-sm text-slate-600">
        This is what other people see when they find you on the map.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">This profile is for</legend>
          <div className="mt-2 flex gap-3">
            {(["individual", "business"] as const).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setProfileKind(v)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize ${
                  profileKind === v
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">I am a</legend>
          <div className="mt-2 flex gap-3">
            {[
              { v: "seller", label: "Seller / Business" },
              { v: "buyer", label: "Buyer / Client" },
              { v: "both", label: "Both" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.v}
                onClick={() => setRole(opt.v as any)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  role === opt.v
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="text-sm font-medium text-slate-700">
            {profileKind === "business" ? "Business name" : "Your name"}
          </label>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Headline</label>
          <input
            placeholder="e.g. Commercial concrete contractor, licensed & insured"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">State</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Location on map</label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {locating ? "Locating..." : "Use my location"}
            </button>
            {coords && (
              <span className="text-sm text-slate-600">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={coords?.lat ?? ""}
              onChange={(e) =>
                setCoords((c) => ({ lat: parseFloat(e.target.value), lng: c?.lng ?? 0 }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={coords?.lng ?? ""}
              onChange={(e) =>
                setCoords((c) => ({ lat: c?.lat ?? 0, lng: parseFloat(e.target.value) }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Service radius (km)</label>
          <input
            type="number"
            min={1}
            max={500}
            value={serviceRadiusKm}
            onChange={(e) => setServiceRadiusKm(parseInt(e.target.value || "0", 10))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Map visibility</label>
          <select
            value={visibilityLevel}
            onChange={(e) => setVisibilityLevel(e.target.value as any)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="exact">Exact location</option>
            <option value="approximate">Approximate (~1.5km offset) — recommended</option>
            <option value="city_only">City only (~5km offset)</option>
            <option value="hidden">Hidden from map</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            We never show your exact address by default. Approximate locations are
            randomly offset so nearby matches still work without exposing precise
            coordinates.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save profile & go to map"}
        </button>
      </form>
    </div>
  );
}
