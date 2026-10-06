CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Song" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "artist" TEXT NOT NULL DEFAULT 'Qanoni Audio',
  "description" TEXT,
  "coverUrl" TEXT NOT NULL,
  "audioUrl" TEXT NOT NULL,
  "duration" INTEGER NOT NULL DEFAULT 0,
  "categoryId" TEXT,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "plays" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Song_isPublished_createdAt_idx" ON "Song"("isPublished", "createdAt");
CREATE INDEX "Song_categoryId_idx" ON "Song"("categoryId");
CREATE INDEX "Song_title_idx" ON "Song"("title");

ALTER TABLE "Song" ADD CONSTRAINT "Song_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
