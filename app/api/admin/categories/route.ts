import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ name: z.string().min(1).max(60), slug: z.string().min(1).max(70).regex(/^[a-z0-9-]+$/) });

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  return NextResponse.json(await prisma.category.findMany({ include: { _count: { select: { songs: true } } }, orderBy: { name: 'asc' } }));
}

export async function POST(request: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid category data' }, { status: 400 });
  try { return NextResponse.json(await prisma.category.create({ data: parsed.data }), { status: 201 }); }
  catch { return NextResponse.json({ error: 'Category name or slug already exists.' }, { status: 409 }); }
}
