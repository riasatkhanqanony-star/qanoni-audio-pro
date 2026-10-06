import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { songs: { where: { isPublished: true } } } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Public categories error:', error);
    return NextResponse.json({ error: 'Catalog is temporarily unavailable.' }, { status: 503 });
  }
}
