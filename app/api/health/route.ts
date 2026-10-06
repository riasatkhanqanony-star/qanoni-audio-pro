import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const startedAt = Date.now();
  const databaseUrl = process.env.DATABASE_URL || '';
  const configured = databaseUrl.length > 0;
  const looksLocal = /localhost|127\.0\.0\.1/i.test(databaseUrl);

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: {
        configured,
        connected: true,
        provider: 'postgresql',
        environment: looksLocal ? 'local' : 'hosted',
      },
      storage: {
        mode: process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local-public',
      },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check database error:', error);
    return NextResponse.json(
      {
        ok: false,
        database: {
          configured,
          connected: false,
          provider: 'postgresql',
          environment: looksLocal ? 'local' : 'hosted',
          message: looksLocal
            ? 'DATABASE_URL points to localhost. Use a hosted PostgreSQL URL for Vercel.'
            : 'The configured PostgreSQL database could not be reached.',
        },
        storage: {
          mode: process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local-public',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
