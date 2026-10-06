# Qanoni Audio Pro — Vercel deployment

## Architecture

- Next.js public frontend and server API routes live in one Vercel project.
- Prisma manages the PostgreSQL catalog.
- PostgreSQL is the source of truth for songs, categories, counters, and site settings.
- Vercel Blob is used for persistent runtime media uploads in production.
- `/admin` is a private studio and is excluded from public navigation and search indexing.

## 1. Create the online PostgreSQL database

Use a managed PostgreSQL provider. The simplest Vercel path is the Prisma Postgres Marketplace integration, or use a hosted provider such as Neon. Copy its connection string into the Vercel project as `DATABASE_URL`.

Do not use `localhost` in production. Vercel cannot reach a database running only on your computer.

## 2. Create Vercel Blob

Create a Blob store and add its `BLOB_READ_WRITE_TOKEN` to the Vercel project. Set:

```text
NEXT_PUBLIC_VERCEL_BLOB_ENABLED=true
```

The admin file picker then uploads covers and audio to Blob instead of trying to write to the Vercel function filesystem.

## 3. Configure admin authentication

Generate a bcrypt hash locally:

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_PASSWORD_HERE', 12))"
```

Add the hash to Vercel as `ADMIN_PASSWORD_HASH`, and add `ADMIN_EMAIL`. Generate `AUTH_SECRET` with a cryptographically secure random value.

## 4. Deploy the schema

This project contains versioned Prisma migrations. Vercel's Build Command should be:

```text
npm run vercel-build
```

That command runs:

```text
prisma generate
prisma migrate deploy
next build
```

The migrations update the online PostgreSQL database during the deployment.

## 5. Seed demo data (optional)

After configuring `DATABASE_URL` locally to point at the same managed database, run:

```bash
npx prisma db seed
```

The seed creates sample categories, site settings, and demo tracks only when the catalog is empty.

## 6. Test after deployment

Open:

```text
/
/library
/admin/login
/api/health
```

`/api/health` should report a connected database.

## 7. Uploading songs

From `/admin`, open **Songs → Add a track**. Choose the cover image and audio file using the browser file picker. No URL is required. Set title, artist, category, featured/published state, and save.

A published song immediately becomes available to the public catalog. Clicking a song card starts playback in the persistent player.

## 8. Important storage rule

Do not depend on the Vercel function filesystem for production uploads. Use Vercel Blob for runtime-uploaded audio and covers so the files remain available across deployments and serverless instances.
