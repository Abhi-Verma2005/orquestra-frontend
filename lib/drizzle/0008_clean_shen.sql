CREATE TABLE IF NOT EXISTS "WorkflowDefinition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"definition" jsonb NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS "ExecutionPlan" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "PlanStep" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "WorkflowState" CASCADE;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WorkflowSession' AND column_name='workflowId') THEN
      ALTER TABLE "WorkflowSession" ADD COLUMN "workflowId" uuid NOT NULL;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WorkflowSession' AND column_name='currentNode') THEN
      ALTER TABLE "WorkflowSession" ADD COLUMN "currentNode" varchar(100) NOT NULL;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WorkflowSession' AND column_name='status') THEN
      ALTER TABLE "WorkflowSession" ADD COLUMN "status" varchar(50) DEFAULT 'running' NOT NULL;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WorkflowSession' AND column_name='state') THEN
      ALTER TABLE "WorkflowSession" ADD COLUMN "state" jsonb DEFAULT '{}'::jsonb NOT NULL;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WorkflowSession' AND column_name='iterationCount') THEN
      ALTER TABLE "WorkflowSession" ADD COLUMN "iterationCount" integer DEFAULT 0 NOT NULL;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WorkflowSession' AND column_name='nodeVisitCount') THEN
      ALTER TABLE "WorkflowSession" ADD COLUMN "nodeVisitCount" jsonb DEFAULT '{}'::jsonb NOT NULL;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowDefinition_userId_idx" ON "WorkflowDefinition" USING btree ("userId");--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    ALTER TABLE "WorkflowSession" ADD CONSTRAINT "WorkflowSession_workflowId_WorkflowDefinition_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."WorkflowDefinition"("id") ON DELETE no action ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    CREATE INDEX IF NOT EXISTS "workflowSession_workflowId_idx" ON "WorkflowSession" USING btree ("workflowId");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkflowSession') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='unique_active_chat') THEN
      ALTER TABLE "WorkflowSession" ADD CONSTRAINT "unique_active_chat" UNIQUE("chatId","status");
    END IF;
  END IF;
END $$;