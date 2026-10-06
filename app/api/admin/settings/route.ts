import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  appName: z.string().min(1).max(80),
  tagline: z.string().min(1).max(120),
  heroEyebrow: z.string().min(1).max(120),
  heroTitle: z.string().min(1).max(140),
  heroDescription: z.string().min(1).max(700),
  heroButtonText: z.string().min(1).max(60),
  featuredTitle: z.string().min(1).max(100),
  latestTitle: z.string().min(1).max(100),
  footerText: z.string().min(1).max(200),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  allowDownloads: z.boolean(),
  showFeatured: z.boolean(),
  showLatest: z.boolean(),
  showCategories: z.boolean()
});

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json(settings ?? { id: 1 });
}

export async function PATCH(request: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid settings', details: parsed.error.flatten() }, { status: 400 });
  const settings = await prisma.siteSettings.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } });
  return NextResponse.json(settings);
}
