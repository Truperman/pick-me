import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { queryOne } from "@/lib/db";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await queryOne<{ id: string; password_hash: string; full_name: string }>(
    `SELECT id, password_hash, full_name FROM users WHERE email = $1`,
    [email]
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = signSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ id: user.id, email, fullName: user.full_name });
}
