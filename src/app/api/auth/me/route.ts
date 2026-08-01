import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ user: null });

  const user = await queryOne(
    `SELECT id, email, full_name AS "fullName" FROM users WHERE id = $1`,
    [userId]
  );
  const profile = await queryOne(
    `SELECT id, display_name AS "displayName", role, profile_kind AS "profileKind"
     FROM profiles WHERE user_id = $1`,
    [userId]
  );

  return NextResponse.json({ user, profile });
}
