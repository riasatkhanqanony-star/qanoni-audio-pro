import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await prisma.song.updateMany({ where: { id, isPublished: true }, data: { likes: { increment: 1 } } });
    if (!result.count) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.song.findUnique({ where: { id }, select: { likes: true } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Like counter error:', error);
    return NextResponse.json({ error: 'Could not update like count.' }, { status: 503 });
  }
}
