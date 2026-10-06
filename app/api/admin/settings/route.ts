import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { unexpectedApiError, parseJsonBody } from '@/lib/api';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  appName: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(1).max(120),
  heroEyebrow: z.string().trim().min(1).max(120),
  heroTitle: z.string().trim().min(1).max(140),
  heroDescription: z.string().trim().min(1).max(700),
  heroButtonText: z.string().trim().min(1).max(60),
  featuredTitle: z.string().trim().min(1).max(100),
  latestTitle: z.string().trim().min(1).max(100),
  footerText: z.string().trim().min(1).max(200),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  allowDownloads: z.boolean(),
  showFeatured: z.boolean(),
  showLatest: z.boolean(),
  showCategories: z.boolean(),
});

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    return NextResponse.json(settings ?? { id: 1 });
  } catch (error) {
    return unexpectedApiError(error, 'Admin settings GET error');
  }
}

export async function PATCH(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const parsed = schema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings.', details: parsed.error.flatten() }, { status: 422 });
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: parsed.data,
      create: { id: 1, ...parsed.data },
    });

    return NextResponse.json(settings);
  } catch (error) {
    return unexpectedApiError(error, 'Admin settings PATCH error');
  }
}
