-- Add Users table for authentication
CREATE TABLE IF NOT EXISTS "Users" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password" varchar(255) NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "Users"("email");

-- Migrate existing user IDs from Chat table to Users table (create placeholder users)
-- This ensures existing chats can still reference their users
INSERT INTO "Users" ("id", "email", "password", "createdAt", "updatedAt")
SELECT DISTINCT 
  "userId" as "id",
  COALESCE("userId" || '@migrated.local', 'user_' || "userId" || '@migrated.local') as "email",
  '' as "password", -- Empty password - users will need to reset
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Chat"
WHERE "userId" NOT IN (SELECT "id" FROM "Users")
ON CONFLICT ("id") DO NOTHING;

-- Migrate existing user IDs from ChatMembers table
INSERT INTO "Users" ("id", "email", "password", "createdAt", "updatedAt")
SELECT DISTINCT 
  "userId" as "id",
  COALESCE("userId" || '@migrated.local', 'user_' || "userId" || '@migrated.local') as "email",
  '' as "password",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "ChatMembers"
WHERE "userId" NOT IN (SELECT "id" FROM "Users")
ON CONFLICT ("id") DO NOTHING;

-- Migrate existing user IDs from ChatInvites table
INSERT INTO "Users" ("id", "email", "password", "createdAt", "updatedAt")
SELECT DISTINCT 
  "createdBy" as "id",
  COALESCE("createdBy" || '@migrated.local', 'user_' || "createdBy" || '@migrated.local') as "email",
  '' as "password",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "ChatInvites"
WHERE "createdBy" NOT IN (SELECT "id" FROM "Users")
ON CONFLICT ("id") DO NOTHING;

-- Drop execution plan tables if they exist
DROP TABLE IF EXISTS "PlanStep" CASCADE;
DROP TABLE IF EXISTS "ExecutionPlan" CASCADE;

-- Update Chat table to reference Users table
-- First, remove the old foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Chat_userId_Users_id_fk'
  ) THEN
    ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_Users_id_fk";
  END IF;
END $$;

-- Add foreign key constraint to Users table
ALTER TABLE "Chat" 
  ADD CONSTRAINT "Chat_userId_Users_id_fk" 
  FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE;

-- Update ChatMembers to reference Users table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ChatMembers_userId_Users_id_fk'
  ) THEN
    ALTER TABLE "ChatMembers" DROP CONSTRAINT "ChatMembers_userId_Users_id_fk";
  END IF;
END $$;

ALTER TABLE "ChatMembers" 
  ADD CONSTRAINT "ChatMembers_userId_Users_id_fk" 
  FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE;

-- Update ChatInvites to reference Users table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ChatInvites_createdBy_Users_id_fk'
  ) THEN
    ALTER TABLE "ChatInvites" DROP CONSTRAINT "ChatInvites_createdBy_Users_id_fk";
  END IF;
END $$;

ALTER TABLE "ChatInvites" 
  ADD CONSTRAINT "ChatInvites_createdBy_Users_id_fk" 
  FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE CASCADE;

