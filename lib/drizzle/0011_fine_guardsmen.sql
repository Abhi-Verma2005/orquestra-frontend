ALTER TABLE "Session" ADD COLUMN "agentId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "Session" ADD COLUMN "iterationCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Session" ADD COLUMN "workflowState" jsonb;--> statement-breakpoint
ALTER TABLE "Session" ADD COLUMN "executionContext" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "Session" ADD COLUMN "lastError" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Session" ADD CONSTRAINT "Session_agentId_Agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_agentId_idx" ON "Session" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_status_idx" ON "Session" USING btree ("status");--> statement-breakpoint
ALTER TABLE "Session" DROP COLUMN IF EXISTS "state";