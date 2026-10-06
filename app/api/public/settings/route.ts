import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    return NextResponse.json(settings ?? { id: 1 });
  } catch (error) {
    console.error('Public settings error:', error);
    return NextResponse.json({ error: 'Website settings are temporarily unavailable.' }, { status: 503 });
  }
}
