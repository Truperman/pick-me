import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Returns map pins within a bounding box, with optional role/category/keyword
// filters. Uses PostGIS ST_MakeEnvelope + geography intersection for a fast,
// indexed bounding-box query — this is the same pattern used for
// "search as map moves".
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const west = parseFloat(sp.get("west") ?? "-180");
  const south = parseFloat(sp.get("south") ?? "-90");
  const east = parseFloat(sp.get("east") ?? "180");
  const north = parseFloat(sp.get("north") ?? "90");
  const role = sp.get("role"); // buyer | seller | both | null
  const category = sp.get("category");
  const q = sp.get("q");

  const params: any[] = [west, south, east, north];
  const conditions: string[] = [
    `l.is_currently_visible = true`,
    `ST_Intersects(l.display_geom::geometry, ST_MakeEnvelope($1,$2,$3,$4,4326))`,
  ];

  if (role && role !== "any") {
    params.push(role);
    conditions.push(`(p.role = $${params.length} OR p.role = 'both')`);
  }
  if (category) {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    conditions.push(
      `(lower(p.display_name) LIKE $${params.length} OR lower(p.headline) LIKE $${params.length} OR lower(p.description) LIKE $${params.length})`
    );
  }

  const rows = await query(
    `SELECT
        p.id, p.display_name AS "displayName", p.profile_kind AS "profileKind",
        p.role, p.category, p.headline, p.is_verified AS "isVerified",
        l.city, l.state, l.country,
        ST_Y(l.display_geom::geometry) AS lat, ST_X(l.display_geom::geometry) AS lng,
        EXISTS (
          SELECT 1 FROM buyer_requests br WHERE br.profile_id = p.id AND br.status = 'open'
        ) AS "hasOpenRequest",
        EXISTS (
          SELECT 1 FROM seller_offers so WHERE so.profile_id = p.id AND so.status = 'active'
        ) AS "hasActiveOffer"
     FROM location_profiles l
     JOIN profiles p ON p.id = l.profile_id
     WHERE ${conditions.join(" AND ")}
     LIMIT 500`,
    params
  );

  return NextResponse.json({ pins: rows });
}
