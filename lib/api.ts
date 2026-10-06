import { NextResponse } from 'next/server';

function isPrismaError(error: unknown, code: string) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === code;
}

export function databaseUnavailableResponse() {
  return NextResponse.json(
    {
      error: 'Database is unavailable.',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Connect a hosted PostgreSQL database and set DATABASE_URL before using dynamic catalog features.',
    },
    { status: 503 },
  );
}

export function unexpectedApiError(error: unknown, context: string) {
  console.error(`${context}:`, error);

  if (isPrismaError(error, 'P1001') || isPrismaError(error, 'P1002') || isPrismaError(error, 'P1017')) {
    return databaseUnavailableResponse();
  }

  return NextResponse.json(
    { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
    { status: 500 },
  );
}

export async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
