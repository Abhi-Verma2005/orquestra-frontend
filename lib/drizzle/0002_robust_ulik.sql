ALTER TABLE "Chat" ALTER COLUMN "messages" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "SessionState" ADD COLUMN "state" json;
UPDATE "SessionState" SET "state" = '{}'::json WHERE "state" IS NULL;
ALTER TABLE "SessionState" ALTER COLUMN "state" SET DEFAULT '{}'::json;
ALTER TABLE "SessionState" ALTER COLUMN "state" SET NOT NULL;