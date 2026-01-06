ALTER TABLE "AgentState" ADD COLUMN "iterationCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "AgentState" ADD COLUMN "nodeId" varchar(255);