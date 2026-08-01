import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { queryOne } from "@/lib/db";

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  budgetIsPublic: z.boolean().default(true),
  urgency: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  remoteAccepted: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await queryOne<{ id: string }>(`SELECT id FROM profiles WHERE user_id = $1`, [userId]);
  if (!profile) return NextResponse.json({ error: "Create your profile first" }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const request = await queryOne(
    `INSERT INTO buyer_requests
      (profile_id, title, description, category, budget_min, budget_max, budget_is_public, urgency, remote_accepted, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now() + interval '30 days')
     RETURNING id`,
    [
      profile.id,
      d.title,
      d.description,
      d.category,
      d.budgetMin ?? null,
      d.budgetMax ?? null,
      d.budgetIsPublic,
      d.urgency,
      d.remoteAccepted,
    ]
  );

  return NextResponse.json({ id: request!.id });
}
