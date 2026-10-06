import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { unexpectedApiError, parseJsonBody } from '@/lib/api';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().min(1).max(70).regex(/^[a-z0-9-]+$/),
});

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { songs: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return unexpectedApiError(error, 'Admin categories GET error');
  }
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const parsed = schema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid category data.', details: parsed.error.flatten() }, { status: 422 });
    }

    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002') {
      return NextResponse.json({ error: 'Category name or slug already exists.' }, { status: 409 });
    }
    return unexpectedApiError(error, 'Admin categories POST error');
  }
}
