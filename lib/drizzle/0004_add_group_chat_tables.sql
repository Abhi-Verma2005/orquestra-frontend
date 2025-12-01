-- Add isGroupChat column to Chat table
ALTER TABLE "Chat" 
  ADD COLUMN IF NOT EXISTS "isGroupChat" boolean DEFAULT false NOT NULL;

-- Create ChatMembers table
CREATE TABLE IF NOT EXISTS "ChatMembers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "userId" varchar(255) NOT NULL,
  "role" varchar(50) NOT NULL DEFAULT 'member',
  "joinedAt" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for ChatMembers
CREATE INDEX IF NOT EXISTS "chatMembers_chatId_idx" ON "ChatMembers"("chatId");
CREATE INDEX IF NOT EXISTS "chatMembers_userId_idx" ON "ChatMembers"("userId");
CREATE INDEX IF NOT EXISTS "chatMembers_chatId_userId_idx" ON "ChatMembers"("chatId", "userId");

-- Create ChatInvites table
CREATE TABLE IF NOT EXISTS "ChatInvites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "inviteCode" varchar(255) NOT NULL UNIQUE,
  "createdBy" varchar(255) NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "expiresAt" timestamp,
  "maxUses" integer,
  "usedCount" integer DEFAULT 0 NOT NULL
);

-- Create indexes for ChatInvites
CREATE INDEX IF NOT EXISTS "chatInvites_inviteCode_idx" ON "ChatInvites"("inviteCode");
CREATE INDEX IF NOT EXISTS "chatInvites_chatId_idx" ON "ChatInvites"("chatId");

-- Migrate existing chats: add owners to ChatMembers table
INSERT INTO "ChatMembers" ("chatId", "userId", "role", "joinedAt")
SELECT "id", "userId", 'owner', "createdAt"
FROM "Chat"
WHERE NOT EXISTS (
  SELECT 1 FROM "ChatMembers" WHERE "ChatMembers"."chatId" = "Chat"."id"
)
ON CONFLICT DO NOTHING;


