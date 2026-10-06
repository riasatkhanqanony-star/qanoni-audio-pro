import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!settings?.allowDownloads) return NextResponse.json({ error: 'Downloads are disabled.' }, { status: 403 });

    const result = await prisma.song.updateMany({ where: { id, isPublished: true }, data: { downloads: { increment: 1 } } });
    if (!result.count) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const song = await prisma.song.findUnique({ where: { id }, select: { audioUrl: true } });
    return NextResponse.json(song);
  } catch (error) {
    console.error('Download counter error:', error);
    return NextResponse.json({ error: 'Could not prepare download.' }, { status: 503 });
  }
}
