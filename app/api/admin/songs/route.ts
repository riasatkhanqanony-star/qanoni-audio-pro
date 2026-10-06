import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const songSchema = z.object({
  title: z.string().min(1).max(120),
  artist: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  coverUrl: z.string().min(1),
  audioUrl: z.string().min(1),
  duration: z.number().int().min(0).max(86400).default(0),
  categoryId: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export async function GET(request: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const status = searchParams.get('status');
  const songs = await prisma.song.findMany({
    where: {
      ...(status === 'published' ? { isPublished: true } : {}),
      ...(status === 'draft' ? { isPublished: false } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { artist: { contains: q, mode: 'insensitive' } }] } : {})
    },
    include: { category: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
  });
  return NextResponse.json(songs);
}

export async function POST(request: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const parsed = songSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid song data', details: parsed.error.flatten() }, { status: 400 });
  const song = await prisma.song.create({ data: parsed.data, include: { category: true } });
  return NextResponse.json(song, { status: 201 });
}
