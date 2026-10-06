import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const song = await prisma.song.findFirst({
      where: { id, isPublished: true },
      include: { category: true },
    });
    if (!song) return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    return NextResponse.json(song, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Public song detail error:', error);
    return NextResponse.json({ error: 'Track is temporarily unavailable.' }, { status: 503 });
  }
}
