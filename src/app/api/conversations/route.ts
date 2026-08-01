import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

const bodySchema = z.object({
  recipientProfileId: z.string().uuid(),
  buyerRequestId: z.string().uuid().optional(),
  sellerOfferId: z.string().uuid().optional(),
  firstMessage: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { recipientProfileId, buyerRequestId, sellerOfferId, firstMessage } = parsed.data;

  const recipientProfile = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM profiles WHERE id = $1`,
    [recipientProfileId]
  );
  if (!recipientProfile) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }
  if (recipientProfile.user_id === userId) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // Reuse an existing conversation between the same two users if one exists.
  let convo = await queryOne<{ id: string }>(
    `SELECT id FROM conversations
     WHERE (initiated_by = $1 AND recipient_id = $2) OR (initiated_by = $2 AND recipient_id = $1)
     ORDER BY created_at DESC LIMIT 1`,
    [userId, recipientProfile.user_id]
  );

  if (!convo) {
    convo = await queryOne<{ id: string }>(
      `INSERT INTO conversations (initiated_by, recipient_id, buyer_request_id, seller_offer_id)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [userId, recipientProfile.user_id, buyerRequestId ?? null, sellerOfferId ?? null]
    );
  }

  await query(`INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)`, [
    convo!.id,
    userId,
    firstMessage,
  ]);
  await query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [convo!.id]);

  return NextResponse.json({ conversationId: convo!.id });
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await query(
    `SELECT c.id, c.updated_at AS "updatedAt",
            CASE WHEN c.initiated_by = $1 THEN c.recipient_id ELSE c.initiated_by END AS "otherUserId",
            (SELECT display_name FROM profiles WHERE user_id =
              (CASE WHEN c.initiated_by = $1 THEN c.recipient_id ELSE c.initiated_by END)
            ) AS "otherDisplayName",
            (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS "lastMessage"
     FROM conversations c
     WHERE c.initiated_by = $1 OR c.recipient_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );

  return NextResponse.json({ conversations: rows });
}
