import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createSession } from '@/lib/auth';

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim() || '';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim() || '';

  if (!adminEmail || !passwordHash) {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH.' },
      { status: 503 },
    );
  }

  let passwordValid = false;
  try {
    passwordValid = await bcrypt.compare(parsed.data.password, passwordHash);
  } catch {
    passwordValid = false;
  }

  const valid = parsed.data.email.toLowerCase() === adminEmail.toLowerCase() && passwordValid;
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  await createSession(adminEmail);
  return NextResponse.json({ ok: true });
}
