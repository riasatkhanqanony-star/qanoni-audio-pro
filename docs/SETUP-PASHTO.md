# Qanoni Audio Pro — د شروع او Vercel Deploy لارښود

دا پروژه داسې جوړه ده چې **Public Frontend او Admin جلا UI** لري، خو دواړه د یوه PostgreSQL database له dynamic data څخه کار اخلي.

## 1) د Public هدف

کاروونکی:

```text
Home → Song انتخاب → Play → Persistent Player
```

یعنې د Song Card په هر ځای کلیک سره Song Play کېږي. د Play/Pause، Next، Previous، Progress او Volume کنټرولونه شته.

## 2) Admin

```text
http://localhost:3000/admin/login
```

له Admin څخه:

- Song Add
- Song Edit
- Song Delete
- Publish / Draft
- Featured
- Category Add / Edit / Delete
- Website settings
- Cover image Browse
- Audio file Browse

کاروونکی URL نه لیکي. فایل د خپل کمپیوټر له **Browse / Choose File** څخه انتخابېږي.

## 3) PostgreSQL — مهم

د Vercel لپاره `localhost` مه کاروه.

مثلاً دا production لپاره غلط دی:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qanoni_audio"
```

پر ځای یې د managed PostgreSQL provider connection string وکاروه.

تر ټولو ساده Vercel path د **Prisma Postgres Marketplace integration** دی؛ Neon هم مناسب hosted PostgreSQL انتخاب دی.

## 4) Environment variables

په local او Vercel کې دا variables برابر کړه:

```env
DATABASE_URL="YOUR_MANAGED_POSTGRES_CONNECTION_STRING"
AUTH_SECRET="YOUR_RANDOM_SECRET"
ADMIN_EMAIL="YOUR_ADMIN_EMAIL"
ADMIN_PASSWORD_HASH="YOUR_BCRYPT_HASH"
BLOB_READ_WRITE_TOKEN="YOUR_VERCEL_BLOB_TOKEN"
NEXT_PUBLIC_VERCEL_BLOB_ENABLED="true"
NEXT_PUBLIC_APP_NAME="Qanoni Audio"
NEXT_PUBLIC_APP_URL="https://YOUR-PROJECT.vercel.app"
```

## 5) Admin password hash

په خپل computer کې:

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_PASSWORD_HERE', 12))"
```

output د `ADMIN_PASSWORD_HASH` په ځای واچوه.

## 6) Prisma

```bash
npm install
npx prisma generate
```

که database ته connection موجود وي:

```bash
npx prisma migrate deploy
```

Demo data ته اړتیا وي:

```bash
npx prisma db seed
```

## 7) Vercel Deploy

GitHub ته project push کړه، بیا Vercel کې repository Import کړه.

په Vercel project کې Environment Variables پورته اضافه کړه.

د Build Command پروژه کې له مخکې داسې تنظیم شوی:

```text
npm run vercel-build
```

دا اجرا کوي:

```text
prisma generate
↓
prisma migrate deploy
↓
next build
```

## 8) Vercel Blob

د production runtime uploads لپاره Vercel Blob وکاروه.

Admin کې:

```text
Songs → Add a track
↓
Cover → Browse
↓
Audio → Browse
↓
Publish track
```

فایل په cloud storage کې ساتل کېږي او URL database ته save کېږي.

## 9) Health check

Deploy وروسته:

```text
https://YOUR-PROJECT.vercel.app/api/health
```

که database سم وي، `database.connected` باید `true` وي.

## 10) مهمه پایله

```text
Admin
  ↓
PostgreSQL
  ↓
Public API
  ↓
Public Frontend
  ↓
Song Card
  ↓
Play
```

نو Admin کې چې نوی Song اضافه شي او `Published` وي، په public website کې dynamic راځي.
