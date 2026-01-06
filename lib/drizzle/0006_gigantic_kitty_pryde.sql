ALTER TABLE "AgentState" ALTER COLUMN "iterationCount" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "AgentState" ALTER COLUMN "iterationCount" DROP NOT NULL;