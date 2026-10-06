# Vercel + PostgreSQL setup

This application is dynamic and requires a reachable hosted PostgreSQL database.

1. Create a Prisma Postgres or Neon database.
2. Connect it to the Vercel project.
3. Set `DATABASE_URL` in Vercel Production (and Preview if desired).
4. Set `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH`.
5. For persistent audio/cover uploads set `BLOB_READ_WRITE_TOKEN` and `NEXT_PUBLIC_VERCEL_BLOB_ENABLED=true`.
6. Deploy with the existing `vercel-build` script.

For Prisma ORM 6, `prisma migrate deploy` is the production migration command. The project runs it from `vercel-build` so committed migrations are applied during the deployment.

Never use `localhost` or `127.0.0.1` as the production `DATABASE_URL`.
