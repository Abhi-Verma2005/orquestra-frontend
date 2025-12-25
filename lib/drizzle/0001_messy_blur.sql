ALTER TABLE "Chat" ALTER COLUMN "messages" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "SessionState" DROP COLUMN IF EXISTS "state";