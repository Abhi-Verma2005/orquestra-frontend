CREATE TABLE IF NOT EXISTS "WorkflowSession" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WorkflowState" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"state" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "AgentState";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorkflowSession" ADD CONSTRAINT "WorkflowSession_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorkflowState" ADD CONSTRAINT "WorkflowState_sessionId_WorkflowSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."WorkflowSession"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowSession_chatId_idx" ON "WorkflowSession" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowState_sessionId_idx" ON "WorkflowState" USING btree ("sessionId");