import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { queryOne } from "@/lib/db";

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  remoteAvailable: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await queryOne<{ id: string }>(`SELECT id FROM profiles WHERE user_id = $1`, [userId]);
  if (!profile) return NextResponse.json({ error: "Create your profile first" }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const offer = await queryOne(
    `INSERT INTO seller_offers
      (profile_id, title, description, category, price_min, price_max, remote_available, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7, now() + interval '60 days')
     RETURNING id`,
    [profile.id, d.title, d.description, d.category, d.priceMin ?? null, d.priceMax ?? null, d.remoteAvailable]
  );

  return NextResponse.json({ id: offer!.id });
}
