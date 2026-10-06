import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { removeStoredFile } from '@/lib/media';
import { z } from 'zod';

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  artist: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  coverUrl: z.string().min(1).optional(),
  audioUrl: z.string().min(1).optional(),
  duration: z.number().int().min(0).max(86400).optional(),
  categoryId: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  const old = await prisma.song.findUnique({ where: { id } });
  if (!old) return NextResponse.json({ error: 'Song not found' }, { status: 404 });
  const song = await prisma.song.update({ where: { id }, data: parsed.data, include: { category: true } });
  if (parsed.data.coverUrl && parsed.data.coverUrl !== old.coverUrl) await removeStoredFile(old.coverUrl);
  if (parsed.data.audioUrl && parsed.data.audioUrl !== old.audioUrl) await removeStoredFile(old.audioUrl);
  return NextResponse.json(song);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { id } = await params;
  const old = await prisma.song.findUnique({ where: { id } });
  if (!old) return NextResponse.json({ error: 'Song not found' }, { status: 404 });
  await prisma.song.delete({ where: { id } });
  await removeStoredFile(old.coverUrl);
  await removeStoredFile(old.audioUrl);
  return NextResponse.json({ ok: true });
}
