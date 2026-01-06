ALTER TABLE "AgentState" ADD COLUMN "workflow" text[];--> statement-breakpoint
ALTER TABLE "AgentState" DROP COLUMN IF EXISTS "workflowName";