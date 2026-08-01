import { notFound } from "next/navigation";
import { query, queryOne } from "@/lib/db";

export default async function ProfilePage({
  params,
}: PageProps<"/profile/[id]">) {
  const { id } = await params;

  const profile = await queryOne<any>(
    `SELECT p.id, p.display_name AS "displayName", p.profile_kind AS "profileKind",
            p.role, p.category, p.headline, p.description, p.is_verified AS "isVerified",
            p.created_at AS "createdAt",
            l.city, l.state, l.country, l.service_radius_km AS "serviceRadiusKm"
     FROM profiles p
     LEFT JOIN location_profiles l ON l.profile_id = p.id
     WHERE p.id = $1`,
    [id]
  );

  if (!profile) notFound();

  const requests = await query<any>(
    `SELECT id, title, description, category, budget_min AS "budgetMin", budget_max AS "budgetMax",
            budget_is_public AS "budgetIsPublic", urgency, remote_accepted AS "remoteAccepted", created_at AS "createdAt"
     FROM buyer_requests WHERE profile_id = $1 AND status = 'open' ORDER BY created_at DESC`,
    [id]
  );

  const offers = await query<any>(
    `SELECT id, title, description, category, price_min AS "priceMin", price_max AS "priceMax",
            remote_available AS "remoteAvailable", created_at AS "createdAt"
     FROM seller_offers WHERE profile_id = $1 AND status = 'active' ORDER BY created_at DESC`,
    [id]
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{profile.displayName}</h1>
            {profile.isVerified && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {profile.category}
            {profile.city ? ` · ${profile.city}${profile.state ? `, ${profile.state}` : ""}${profile.country ? `, ${profile.country}` : ""}` : ""}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            {profile.profileKind} · {profile.role === "both" ? "Buyer & Seller" : profile.role}
            {profile.serviceRadiusKm ? ` · Serves ~${profile.serviceRadiusKm}km radius` : ""}
          </p>
        </div>
      </div>

      {profile.headline && <p className="mt-6 text-lg font-medium text-slate-800">{profile.headline}</p>}
      {profile.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{profile.description}</p>}

      {requests.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Open requests</h2>
          <div className="mt-3 flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{r.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{r.urgency}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {r.category}
                  {r.budgetIsPublic && (r.budgetMin || r.budgetMax)
                    ? ` · Budget $${r.budgetMin ?? "?"}–$${r.budgetMax ?? "?"}`
                    : ""}
                  {r.remoteAccepted ? " · Remote OK" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Active offers</h2>
          <div className="mt-3 flex flex-col gap-3">
            {offers.map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{o.title}</p>
                <p className="mt-1 text-sm text-slate-600">{o.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {o.category}
                  {o.priceMin || o.priceMax ? ` · $${o.priceMin ?? "?"}–$${o.priceMax ?? "?"}` : ""}
                  {o.remoteAvailable ? " · Remote available" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
