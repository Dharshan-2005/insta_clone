# Validation Report — Instagram Clone Hackathon Build

## Completed checks

- All 6 NestJS services compile successfully from their own workspace build entrypoints.
- Shared types package compiles successfully.
- Frontend TypeScript check (`tsc --noEmit`) passes.
- `scripts/seed-all.ts` type-checks successfully.
- Seed/helper JavaScript wrappers pass Node syntax validation.
- Exactly 5 demo profile images + 15 demo post images = 20 demo images.
- Demo assets are isolated from runtime upload folders.
- API gateway smoke test passes:
  - `/health` → HTTP 200
  - protected `/api/users/profile` without credentials → HTTP 401
- Source scan shows no remaining service-side direct `@prisma/client` imports, old Windows upload path, direct browser post upload bypass, or client-side duplicate access-token cookie.
- Docker runner images for Prisma services copy their generated service-local `.prisma` client into the runtime image.

## Full end-to-end limitations of this repair sandbox

The repair sandbox does not have Docker/PostgreSQL/Kafka installed/running and cannot download missing external Prisma/SWC engine packages. Therefore a real multi-container database seed, browser session, and production Next.js build could not be executed here.

The supplied project is prepared for the intended Docker workflow. `npm run seed` now synchronizes each service schema before loading the deterministic demo data.

## Demo dataset

- 5 accounts
- 1 profile picture per account
- 3 posts per account
- 15 post pictures
- 20 total demo pictures
- New runtime uploads use user-specific/dated folders and do not overwrite demo media.
