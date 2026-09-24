CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id VARCHAR(36) PRIMARY KEY,
  "conversationId" VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  "userId" VARCHAR(36) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_participants_conversationId_userId_key" UNIQUE ("conversationId", "userId")
);
CREATE INDEX IF NOT EXISTS "conversation_participants_userId_idx" ON conversation_participants("userId");

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  "conversationId" VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  "senderId" VARCHAR(36) NOT NULL,
  text TEXT,
  type VARCHAR(50) DEFAULT 'text',
  "mediaPath" TEXT,
  "postId" VARCHAR(36),
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx" ON messages("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON messages("senderId");

CREATE TABLE IF NOT EXISTS stories (
  id VARCHAR(36) PRIMARY KEY,
  "userId" VARCHAR(36) NOT NULL,
  "mediaPath" TEXT NOT NULL,
  "mediaType" VARCHAR(50) DEFAULT 'image',
  caption TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "stories_userId_expiresAt_idx" ON stories("userId", "expiresAt");

CREATE TABLE IF NOT EXISTS story_views (
  id VARCHAR(36) PRIMARY KEY,
  "storyId" VARCHAR(36) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  "viewerId" VARCHAR(36) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "story_views_storyId_viewerId_key" UNIQUE ("storyId", "viewerId")
);
CREATE INDEX IF NOT EXISTS "story_views_storyId_idx" ON story_views("storyId");
CREATE INDEX IF NOT EXISTS "story_views_viewerId_idx" ON story_views("viewerId");

CREATE TABLE IF NOT EXISTS story_likes (
  id VARCHAR(36) PRIMARY KEY,
  "storyId" VARCHAR(36) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  "userId" VARCHAR(36) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "story_likes_storyId_userId_key" UNIQUE ("storyId", "userId")
);
CREATE INDEX IF NOT EXISTS "story_likes_storyId_idx" ON story_likes("storyId");
CREATE INDEX IF NOT EXISTS "story_likes_userId_idx" ON story_likes("userId");
