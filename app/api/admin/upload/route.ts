import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/auth';
import { storeFile } from '@/lib/media';

export const runtime = 'nodejs';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg'];

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const body = await request.json();
      return NextResponse.json(
        await handleUpload({
          body,
          request,
          onBeforeGenerateToken: async (pathname) => {
            await requireAdmin();
            const isAudio = pathname.includes('/audio/');
            return {
              allowedContentTypes: isAudio ? audioTypes : imageTypes,
              addRandomSuffix: true,
              tokenPayload: JSON.stringify({ admin: true }),
            };
          },
          onUploadCompleted: async () => undefined,
        }),
      );
    } catch (error) {
      console.error('Blob upload token error:', error);
      return NextResponse.json({ error: 'Could not prepare the cloud upload.' }, { status: 500 });
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Persistent uploads require Vercel Blob in production. Add BLOB_READ_WRITE_TOKEN.' },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    const type = form.get('type');

    if (!(file instanceof File) || (type !== 'covers' && type !== 'audio')) {
      return NextResponse.json({ error: 'File and type are required.' }, { status: 400 });
    }

    const allowed = type === 'audio' ? audioTypes : imageTypes;
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    const max = type === 'audio' ? 40 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > max) {
      return NextResponse.json(
        { error: `File is too large. Maximum is ${Math.round(max / 1024 / 1024)}MB.` },
        { status: 400 },
      );
    }

    return NextResponse.json({ url: await storeFile(file, type) });
  } catch (error) {
    console.error('Local upload error:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
