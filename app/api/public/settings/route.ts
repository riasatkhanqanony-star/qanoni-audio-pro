import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unexpectedApiError } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    return NextResponse.json(settings ?? { id: 1 });
  } catch (error) {
    return unexpectedApiError(error, 'Public settings error');
  }
}
