CREATE TABLE IF NOT EXISTS "AgentState" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"userId" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"currentStep" varchar(50) NOT NULL,
	"workflowName" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "SessionState";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentState" ADD CONSTRAINT "AgentState_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agentState_chatId_idx" ON "AgentState" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agentState_userId_idx" ON "AgentState" USING btree ("userId");