import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { del, put } from '@vercel/blob';

const folders = {
  covers: 'pictures',
  audio: 'audios'
} as const;

export async function storeFile(file: File, folder: keyof typeof folders) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safe = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`qanoni-audio/${folder}/${safe}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type || undefined
    });
    return blob.url;
  }

  const publicFolder = path.join(process.cwd(), 'public', 'media', folders[folder]);
  await fs.mkdir(publicFolder, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(publicFolder, safe), bytes);
  return `/media/${folders[folder]}/${safe}`;
}

export async function removeStoredFile(url?: string | null) {
  if (!url) return;

  if (url.startsWith('https://') && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(url);
    } catch {
      // A missing blob should not break database cleanup.
    }
    return;
  }

  if (url.startsWith('/media/')) {
    try {
      await fs.unlink(path.join(process.cwd(), 'public', url.replace(/^\/+/, '')));
    } catch {
      // A missing local file should not break database cleanup.
    }
  }
}
