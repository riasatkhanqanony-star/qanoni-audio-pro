import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const startedAt = Date.now();
  const configured = Boolean(process.env.DATABASE_URL);

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: { configured, connected: true },
      storage: {
        mode: process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local-public',
      },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        database: { configured, connected: false },
        storage: {
          mode: process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local-public',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
