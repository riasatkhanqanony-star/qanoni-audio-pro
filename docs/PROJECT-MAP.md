# Project Map

- `app/page.tsx`: public home/discover experience.
- `app/library/page.tsx`: searchable full library.
- `components/player-provider.tsx`: global audio player.
- `components/song-card.tsx`: cover cards.
- `components/song-list.tsx`: professional table/list.
- `components/nav.tsx`: desktop/mobile navigation.
- `app/admin/page.tsx`: full CRUD admin studio.
- `app/admin/login/page.tsx`: admin authentication UI.
- `app/api/admin/upload/route.ts`: secure file upload; Vercel Blob in production and local filesystem in development.
- `app/api/admin/songs`: song CRUD API.
- `app/api/admin/categories`: category CRUD API.
- `app/api/public/songs`: public search/list API.
- `app/api/public/songs/[id]/play`: play counter.
- `app/api/public/songs/[id]/like`: like counter.
- `prisma/schema.prisma`: PostgreSQL data model.
- `prisma/seed.ts`: starter categories and demo records.
- `public/media/pictures`: supplied image assets.
- `public/media/audios`: supplied audio assets.
