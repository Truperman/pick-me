import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, fullName } = parsed.data;

  const existing = await queryOne(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await queryOne<{ id: string }>(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1,$2,$3) RETURNING id`,
    [email, passwordHash, fullName]
  );

  const token = signSession(user!.id);
  await setSessionCookie(token);

  return NextResponse.json({ id: user!.id, email, fullName });
}
