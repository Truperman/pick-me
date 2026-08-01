import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/map/profile/[id]">
) {
  const { id } = await ctx.params;

  const profile = await queryOne(
    `SELECT p.id, p.display_name AS "displayName", p.profile_kind AS "profileKind",
            p.role, p.category, p.headline, p.description, p.is_verified AS "isVerified",
            p.created_at AS "createdAt",
            l.city, l.state, l.country, l.service_radius_km AS "serviceRadiusKm",
            ST_Y(l.display_geom::geometry) AS lat, ST_X(l.display_geom::geometry) AS lng
     FROM profiles p
     LEFT JOIN location_profiles l ON l.profile_id = p.id
     WHERE p.id = $1`,
    [id]
  );

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const requests = await query(
    `SELECT id, title, description, category, budget_min AS "budgetMin", budget_max AS "budgetMax",
            budget_is_public AS "budgetIsPublic", urgency, remote_accepted AS "remoteAccepted",
            status, created_at AS "createdAt"
     FROM buyer_requests WHERE profile_id = $1 AND status = 'open' ORDER BY created_at DESC`,
    [id]
  );

  const offers = await query(
    `SELECT id, title, description, category, price_min AS "priceMin", price_max AS "priceMax",
            remote_available AS "remoteAvailable", status, created_at AS "createdAt"
     FROM seller_offers WHERE profile_id = $1 AND status = 'active' ORDER BY created_at DESC`,
    [id]
  );

  return NextResponse.json({ profile, requests, offers });
}
