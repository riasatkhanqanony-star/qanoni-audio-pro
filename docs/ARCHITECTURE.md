# Qanoni Audio Pro — Architecture

```text
Browser
  ├── Public UI (Next.js)
  │     ├── Home
  │     ├── Library
  │     └── Song detail + persistent audio player
  │
  └── Private Admin UI (Next.js)
        ├── Overview
        ├── Songs CRUD
        ├── Categories CRUD
        └── Website settings

Next.js Route Handlers
  ├── /api/public/*
  ├── /api/admin/*
  └── /api/auth/*
        │
        ├── Prisma → PostgreSQL
        │
        └── Vercel Blob → images/audio in production

Local media fallback
  public/media/pictures
  public/media/audios
```

## Dynamic data

`Song`, `Category`, and `SiteSettings` are PostgreSQL-backed. There is no hardcoded public catalog requirement: the admin can create, edit, publish, feature, categorize and delete tracks, then the public pages read the database.

## Media lifecycle

1. Admin selects files with a browser/mobile file picker.
2. Local development stores them in `public/media`.
3. Production uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured.
4. The returned media URL is stored with the song row.
5. Replacing or deleting a song removes the old stored media where possible.
