# Qanoni Audio Pro — Dynamic Audio Streaming Platform

A production-minded full-stack ringtone / short-audio platform built around **Next.js App Router + PostgreSQL + Prisma + Vercel Blob**, with a public listening experience and a fully separate admin studio.

## What this rebuild fixes

- Public visitors never see the admin studio in the main navigation.
- Public UI is a modern SoundCloud-inspired dark audio experience, not an admin dashboard.
- Visitors can search, filter, open a dedicated song page, play audio, queue next/previous, like tracks and download when enabled.
- Admin can add, edit, delete, publish/unpublish and feature tracks.
- Admin uses real **Browse / file picker** controls for cover images and audio. No public URL typing is required.
- Categories are dynamic and editable.
- Homepage text, section titles, accent color, download permission and visible sections are stored in PostgreSQL and editable from the Website tab.
- Local development stores media in `public/media/pictures` and `public/media/audios`.
- Production can use Vercel Blob, which is required for persistent runtime uploads on Vercel. Large files should use client uploads.
- PostgreSQL is the single source of truth for catalog and settings.

## Stack

- Next.js 15.5.27
- React 19
- TypeScript
- Prisma 6
- PostgreSQL
- Vercel Blob
- httpOnly JWT cookie for admin session
- Lucide icons

## Local setup

1. Install Node.js LTS and PostgreSQL.
2. Create a PostgreSQL database, for example `qanoni_audio`.
3. Copy `.env.example` to `.env.local`.
4. Fill `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`.
5. Install and generate:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open:

- Public: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- Admin studio: `http://localhost:3000/admin`

### Admin password hash

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_PASSWORD_HERE', 12))"
```

Put the output in `ADMIN_PASSWORD_HASH`.

## File uploads

### Local

The admin file picker uploads to:

```text
public/media/pictures/
public/media/audios/
```

and saves those public paths in PostgreSQL.

### Vercel production

Create a Vercel Blob store and add:

```text
BLOB_READ_WRITE_TOKEN=...
NEXT_PUBLIC_VERCEL_BLOB_ENABLED=true
```

The browser can upload larger audio directly to Blob through `/api/admin/upload`, while the database stores the resulting public URL.

## PostgreSQL production

Use a hosted PostgreSQL provider such as Neon, Supabase Postgres, or another managed PostgreSQL service. Add its connection string to Vercel as `DATABASE_URL`.

Then deploy migrations:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Vercel

This is a Next.js application and is deployable as one Vercel project. The same app contains:

- public frontend routes
- admin frontend routes
- server API routes
- Prisma database access
- upload token route

Set these Vercel environment variables:

```text
DATABASE_URL=...
AUTH_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD_HASH=...
BLOB_READ_WRITE_TOKEN=...
NEXT_PUBLIC_VERCEL_BLOB_ENABLED=true
NEXT_PUBLIC_APP_NAME=Qanoni Audio
```

Do **not** put database credentials or Blob tokens behind `NEXT_PUBLIC_`.

## Routes

### Public

- `/`
- `/library`
- `/song/[id]`
- `/admin/login` is intentionally separate from the public navigation.

### Admin

- `/admin`
- `/admin/login`

### Public API

- `GET /api/public/settings`
- `GET /api/public/categories`
- `GET /api/public/songs`
- `GET /api/public/songs/[id]`
- `POST /api/public/songs/[id]/play`
- `POST /api/public/songs/[id]/like`
- `POST /api/public/songs/[id]/download`

### Admin API

- `GET/POST /api/admin/songs`
- `PATCH/DELETE /api/admin/songs/[id]`
- `GET/POST /api/admin/categories`
- `PATCH/DELETE /api/admin/categories/[id]`
- `GET/PATCH /api/admin/settings`
- `POST /api/admin/upload`
- auth routes under `/api/auth/*`

## Important Vercel storage note

Vercel serverless function filesystems are not persistent storage. That is why production runtime uploads are designed around Vercel Blob instead of relying on `public/uploads` after deployment. Vercel also documents a request body limit for server uploads; client uploads are the right approach for larger audio files.

## Design direction

The public side is **inspired by professional audio platforms**: dark layered surfaces, strong album artwork, a sticky playback bar, fast search, category chips, dense track lists and a dedicated listening page. It is an original Qanoni Audio design rather than a copy of another site's exact UI.


## Production build

For Vercel, set the Build Command to:

```bash
npm run vercel-build
```

This generates Prisma Client, applies committed migrations, and builds Next.js. A `postinstall` hook also runs `prisma generate`, which avoids stale Prisma Client artifacts on cached Vercel dependencies.

## Health check

`GET /api/health` verifies the PostgreSQL connection and reports whether production storage is using Vercel Blob.

## Clean package note

The distributed project intentionally does **not** contain `.env.local`, real credentials, `node_modules`, `.next`, or Vercel deployment tokens. Copy `.env.example` to your own local environment and add your own managed PostgreSQL, admin, and Blob credentials.
