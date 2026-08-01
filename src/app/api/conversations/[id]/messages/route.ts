import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

async function assertParticipant(conversationId: string, userId: string) {
  return queryOne(
    `SELECT id FROM conversations WHERE id = $1 AND (initiated_by = $2 OR recipient_id = $2)`,
    [conversationId, userId]
  );
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/conversations/[id]/messages">
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const convo = await assertParticipant(id, userId);
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await query(
    `SELECT id, sender_id AS "senderId", body, created_at AS "createdAt"
     FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [id]
  );

  return NextResponse.json({ messages });
}

const bodySchema = z.object({ body: z.string().min(1).max(4000) });

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/conversations/[id]/messages">
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await ctx.params;
  const convo = await assertParticipant(id, userId);
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await queryOne(
    `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)
     RETURNING id, sender_id AS "senderId", body, created_at AS "createdAt"`,
    [id, userId, parsed.data.body]
  );
  await query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [id]);

  return NextResponse.json({ message });
}
