ALTER TABLE "Song" ADD COLUMN "downloads" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Category_name_idx" ON "Category"("name");
CREATE INDEX "Song_isPublished_isFeatured_createdAt_idx" ON "Song"("isPublished", "isFeatured", "createdAt");
CREATE INDEX "Song_plays_idx" ON "Song"("plays");
CREATE INDEX "Song_likes_idx" ON "Song"("likes");

CREATE TABLE "SiteSettings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "appName" TEXT NOT NULL DEFAULT 'Qanoni Audio',
  "tagline" TEXT NOT NULL DEFAULT 'Your sound. Your style.',
  "heroEyebrow" TEXT NOT NULL DEFAULT 'Premium audio library',
  "heroTitle" TEXT NOT NULL DEFAULT 'Sound that feels like yours.',
  "heroDescription" TEXT NOT NULL DEFAULT 'Discover polished ringtones and short audio moments. Play instantly, save favorites, and explore a catalog curated for everyday listening.',
  "heroButtonText" TEXT NOT NULL DEFAULT 'Explore library',
  "featuredTitle" TEXT NOT NULL DEFAULT 'Featured for you',
  "latestTitle" TEXT NOT NULL DEFAULT 'Latest drops',
  "footerText" TEXT NOT NULL DEFAULT 'Qanoni Audio — a modern audio catalog platform.',
  "accentColor" TEXT NOT NULL DEFAULT '#ff5a1f',
  "allowDownloads" BOOLEAN NOT NULL DEFAULT true,
  "showFeatured" BOOLEAN NOT NULL DEFAULT true,
  "showLatest" BOOLEAN NOT NULL DEFAULT true,
  "showCategories" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
