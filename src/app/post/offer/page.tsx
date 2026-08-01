"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

export default function PostOfferPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        priceMin: priceMin ? parseFloat(priceMin) : undefined,
        priceMax: priceMax ? parseFloat(priceMax) : undefined,
        remoteAvailable,
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
    <div className="mx-auto w-full max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Post what you offer</h1>
      <p className="mt-1 text-sm text-slate-600">
        This shows up as an offer pin on the map for nearby buyers to find.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input
            required
            placeholder="e.g. Concrete crew available next week"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Price min ($)</label>
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Price max ($)</label>
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={remoteAvailable} onChange={(e) => setRemoteAvailable(e.target.checked)} />
          Available remotely
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post offer"}
        </button>
      </form>
    </div>
  );
}
