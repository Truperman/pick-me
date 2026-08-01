import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { jitterCoordinate } from "@/lib/geo";

const bodySchema = z.object({
  profileKind: z.enum(["individual", "business"]),
  role: z.enum(["buyer", "seller", "both"]),
  displayName: z.string().min(1),
  category: z.string().min(1),
  headline: z.string().optional(),
  description: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  serviceRadiusKm: z.number().min(0).max(500).default(25),
  visibilityLevel: z.enum(["exact", "approximate", "city_only", "hidden"]).default("approximate"),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await queryOne<{ id: string }>(`SELECT id FROM profiles WHERE user_id = $1`, [userId]);
  if (existing) {
    return NextResponse.json({ error: "Profile already exists for this user" }, { status: 409 });
  }

  const profile = await queryOne<{ id: string }>(
    `INSERT INTO profiles (user_id, profile_kind, role, display_name, category, headline, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [userId, d.profileKind, d.role, d.displayName, d.category, d.headline ?? null, d.description ?? null]
  );

  // Approximate/city_only visibility jitters the publicly-shown pin location.
  // "hidden" still stores a display point but the map query layer excludes it.
  let displayLat = d.lat;
  let displayLng = d.lng;
  if (d.visibilityLevel === "approximate") {
    const jittered = jitterCoordinate(d.lat, d.lng, 1.5);
    displayLat = jittered.lat;
    displayLng = jittered.lng;
  } else if (d.visibilityLevel === "city_only") {
    const jittered = jitterCoordinate(d.lat, d.lng, 5);
    displayLat = jittered.lat;
    displayLng = jittered.lng;
  }

  await query(
    `INSERT INTO location_profiles
      (profile_id, geom, display_geom, city, state, country, postal_code, service_radius_km, visibility_level, is_currently_visible)
     VALUES
      ($1,
       ST_SetSRID(ST_MakePoint($2,$3),4326)::geography,
       ST_SetSRID(ST_MakePoint($4,$5),4326)::geography,
       $6,$7,$8,$9,$10,$11, $12)`,
    [
      profile!.id,
      d.lng,
      d.lat,
      displayLng,
      displayLat,
      d.city ?? null,
      d.state ?? null,
      d.country ?? null,
      d.postalCode ?? null,
      d.serviceRadiusKm,
      d.visibilityLevel,
      d.visibilityLevel !== "hidden",
    ]
  );

  return NextResponse.json({ id: profile!.id });
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await queryOne(
    `SELECT p.*, l.city, l.state, l.country, l.service_radius_km AS "serviceRadiusKm",
            l.visibility_level AS "visibilityLevel",
            ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lng
     FROM profiles p
     LEFT JOIN location_profiles l ON l.profile_id = p.id
     WHERE p.user_id = $1`,
    [userId]
  );

  return NextResponse.json({ profile });
}
