import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const category = searchParams.get('category')?.trim();
    const sort = searchParams.get('sort') || 'latest';
    const featured = searchParams.get('featured') === 'true';
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 100), 1), 200);

    const orderBy =
      sort === 'plays'
        ? [{ plays: 'desc' as const }, { createdAt: 'desc' as const }]
        : sort === 'likes'
          ? [{ likes: 'desc' as const }, { createdAt: 'desc' as const }]
          : sort === 'featured'
            ? [{ isFeatured: 'desc' as const }, { sortOrder: 'asc' as const }, { createdAt: 'desc' as const }]
            : [{ createdAt: 'desc' as const }];

    const songs = await prisma.song.findMany({
      where: {
        isPublished: true,
        ...(featured ? { isFeatured: true } : {}),
        ...(category ? { category: { slug: category } } : {}),
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
      orderBy,
      take: limit,
    });

    return NextResponse.json(songs, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Public songs error:', error);
    return NextResponse.json({ error: 'Audio catalog is temporarily unavailable.' }, { status: 503 });
  }
}
