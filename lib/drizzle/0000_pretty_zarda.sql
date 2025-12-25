CREATE TABLE IF NOT EXISTS "Chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"messages" json NOT NULL,
	"userId" varchar(255) NOT NULL,
	"title" varchar(255),
	"summary" varchar(2000),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"isGroupChat" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatInvites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"inviteCode" varchar(255) NOT NULL,
	"createdBy" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	"maxUses" integer,
	"usedCount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ChatInvites_inviteCode_unique" UNIQUE("inviteCode")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatMembers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"userId" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ExecutionPlan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"summary" varchar(500),
	"currentStepIndex" integer DEFAULT 0 NOT NULL,
	"totalSteps" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "MessageEmbeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" varchar(255) NOT NULL,
	"pineconeId" varchar(255) NOT NULL,
	"chunkIndex" integer DEFAULT 0 NOT NULL,
	"hash" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ready' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PlanStep" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planId" uuid NOT NULL,
	"stepIndex" integer NOT NULL,
	"description" varchar(500) NOT NULL,
	"toolName" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"result" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "SessionState" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"userId" varchar(255) NOT NULL,
	"currentStep" varchar(50) NOT NULL,
	"topic" varchar(255),
	"state" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatInvites" ADD CONSTRAINT "ChatInvites_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatMembers" ADD CONSTRAINT "ChatMembers_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ExecutionPlan" ADD CONSTRAINT "ExecutionPlan_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PlanStep" ADD CONSTRAINT "PlanStep_planId_ExecutionPlan_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."ExecutionPlan"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SessionState" ADD CONSTRAINT "SessionState_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatInvites_inviteCode_idx" ON "ChatInvites" USING btree ("inviteCode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatInvites_chatId_idx" ON "ChatInvites" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatMembers_chatId_idx" ON "ChatMembers" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatMembers_userId_idx" ON "ChatMembers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatMembers_chatId_userId_idx" ON "ChatMembers" USING btree ("chatId","userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessionState_chatId_idx" ON "SessionState" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessionState_userId_idx" ON "SessionState" USING btree ("userId");