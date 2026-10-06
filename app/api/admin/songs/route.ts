import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { unexpectedApiError, parseJsonBody } from '@/lib/api';
import { z } from 'zod';

export const runtime = 'nodejs';

const songSchema = z.object({
  title: z.string().trim().min(1).max(120),
  artist: z.string().trim().min(1).max(120).default('Qanoni Audio'),
  description: z.string().max(1000).optional().nullable(),
  coverUrl: z.string().trim().min(1),
  audioUrl: z.string().trim().min(1),
  duration: z.number().int().min(0).max(86400).default(0),
  categoryId: z.string().trim().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(-2147483648).max(2147483647).default(0),
});

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
}

export async function GET(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const status = searchParams.get('status');
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 200), 1), 500);

    const songs = await prisma.song.findMany({
      where: {
        ...(status === 'published' ? { isPublished: true } : {}),
        ...(status === 'draft' ? { isPublished: false } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { artist: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return NextResponse.json(songs, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return unexpectedApiError(error, 'Admin songs GET error');
  }
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const parsed = songSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid song data.', details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    if (parsed.data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
      if (!category) {
        return NextResponse.json({ error: 'Selected category was not found.' }, { status: 422 });
      }
    }

    const song = await prisma.song.create({
      data: parsed.data,
      include: { category: true },
    });

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    return unexpectedApiError(error, 'Admin songs POST error');
  }
}
