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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const { id } = await params;
    const parsed = schema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid category data.', details: parsed.error.flatten() }, { status: 422 });
    }

    const category = await prisma.category.update({ where: { id }, data: parsed.data });
    return NextResponse.json(category);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: unknown }).code;
      if (code === 'P2002') return NextResponse.json({ error: 'Category name or slug already exists.' }, { status: 409 });
      if (code === 'P2025') return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }
    return unexpectedApiError(error, 'Admin categories PATCH error');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    return unexpectedApiError(error, 'Admin categories DELETE error');
  }
}
