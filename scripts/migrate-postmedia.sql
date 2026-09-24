ALTER TABLE posts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "commentsEnabled" BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "likesEnabled" BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS post_media (
  id VARCHAR(36) PRIMARY KEY,
  "postId" VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'image',
  path TEXT NOT NULL,
  "thumbnailPath" TEXT,
  "mimeType" VARCHAR(100),
  size INTEGER,
  width INTEGER,
  height INTEGER,
  duration DOUBLE PRECISION,
  position INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "post_media_postId_idx" ON post_media("postId");

-- Backfill existing posts into post_media if empty
INSERT INTO post_media (id, "postId", type, path, position, "createdAt")
SELECT 
  gen_random_uuid()::text,
  p.id,
  p."mediaType",
  p."mediaPath",
  0,
  p."createdAt"
FROM posts p
WHERE NOT EXISTS (
  SELECT 1 FROM post_media pm WHERE pm."postId" = p.id
) AND p."mediaPath" IS NOT NULL AND p."mediaPath" != '';
