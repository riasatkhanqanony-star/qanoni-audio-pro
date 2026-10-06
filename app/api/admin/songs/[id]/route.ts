import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { removeStoredFile } from '@/lib/media';
import { unexpectedApiError, parseJsonBody } from '@/lib/api';
import { z } from 'zod';

export const runtime = 'nodejs';

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  artist: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  coverUrl: z.string().trim().min(1).optional(),
  audioUrl: z.string().trim().min(1).optional(),
  duration: z.number().int().min(0).max(86400).optional(),
  categoryId: z.string().trim().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(-2147483648).max(2147483647).optional(),
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
    const parsed = patchSchema.safeParse(await parseJsonBody(request));

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid song data.', details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const old = await prisma.song.findUnique({ where: { id } });
    if (!old) return NextResponse.json({ error: 'Song not found.' }, { status: 404 });

    if (parsed.data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
      if (!category) return NextResponse.json({ error: 'Selected category was not found.' }, { status: 422 });
    }

    const song = await prisma.song.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });

    if (parsed.data.coverUrl && parsed.data.coverUrl !== old.coverUrl) {
      await removeStoredFile(old.coverUrl);
    }

    if (parsed.data.audioUrl && parsed.data.audioUrl !== old.audioUrl) {
      await removeStoredFile(old.audioUrl);
    }

    return NextResponse.json(song);
  } catch (error) {
    return unexpectedApiError(error, 'Admin songs PATCH error');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const { id } = await params;
    const old = await prisma.song.findUnique({ where: { id } });
    if (!old) return NextResponse.json({ error: 'Song not found.' }, { status: 404 });

    await prisma.song.delete({ where: { id } });

    await Promise.allSettled([
      removeStoredFile(old.coverUrl),
      removeStoredFile(old.audioUrl),
    ]);

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    return unexpectedApiError(error, 'Admin songs DELETE error');
  }
}
