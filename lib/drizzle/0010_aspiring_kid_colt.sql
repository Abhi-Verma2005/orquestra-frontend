CREATE TABLE IF NOT EXISTS "AgentTools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agentId" uuid NOT NULL,
	"toolId" uuid NOT NULL,
	"config" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agentTools_agentId_toolId_unique" UNIQUE("agentId","toolId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"mode" varchar(50) DEFAULT 'simple' NOT NULL,
	"systemPrompt" text,
	"modelConfigId" uuid,
	"workflowId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ApiKeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"encryptedKey" text NOT NULL,
	"keyHash" varchar(255) NOT NULL,
	"label" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatAgents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"agentId" uuid NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chatAgents_chatId_agentId_unique" UNIQUE("chatId","agentId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ModelConfigs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(255) NOT NULL,
	"apiKeyId" uuid NOT NULL,
	"temperature" real DEFAULT 0.7,
	"maxTokens" integer DEFAULT 2000,
	"topP" real DEFAULT 1,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "NodeTools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nodeId" uuid NOT NULL,
	"toolId" uuid NOT NULL,
	"config" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nodeTools_nodeId_toolId_unique" UNIQUE("nodeId","toolId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"parametersSchema" jsonb NOT NULL,
	"implementation" varchar(50) NOT NULL,
	"config" jsonb,
	"isPublic" boolean DEFAULT true NOT NULL,
	"createdBy" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Tools_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WorkflowEdges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflowId" uuid NOT NULL,
	"sourceNodeKey" varchar(255) NOT NULL,
	"targetNodeKey" varchar(255) NOT NULL,
	"label" varchar(255),
	"condition" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WorkflowNodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflowId" uuid NOT NULL,
	"nodeKey" varchar(255) NOT NULL,
	"label" varchar(255),
	"nodeType" varchar(50) NOT NULL,
	"systemPrompt" text,
	"modelConfigId" uuid,
	"toolId" uuid,
	"condition" jsonb,
	"position" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workflowNodes_workflowId_nodeKey_unique" UNIQUE("workflowId","nodeKey")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentTools" ADD CONSTRAINT "AgentTools_agentId_Agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentTools" ADD CONSTRAINT "AgentTools_toolId_Tools_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."Tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Agents" ADD CONSTRAINT "Agents_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Agents" ADD CONSTRAINT "Agents_modelConfigId_ModelConfigs_id_fk" FOREIGN KEY ("modelConfigId") REFERENCES "public"."ModelConfigs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Agents" ADD CONSTRAINT "Agents_workflowId_Workflows_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."Workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ApiKeys" ADD CONSTRAINT "ApiKeys_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatAgents" ADD CONSTRAINT "ChatAgents_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatAgents" ADD CONSTRAINT "ChatAgents_agentId_Agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ModelConfigs" ADD CONSTRAINT "ModelConfigs_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ModelConfigs" ADD CONSTRAINT "ModelConfigs_apiKeyId_ApiKeys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."ApiKeys"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "NodeTools" ADD CONSTRAINT "NodeTools_nodeId_WorkflowNodes_id_fk" FOREIGN KEY ("nodeId") REFERENCES "public"."WorkflowNodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "NodeTools" ADD CONSTRAINT "NodeTools_toolId_Tools_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."Tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorkflowEdges" ADD CONSTRAINT "WorkflowEdges_workflowId_Workflows_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."Workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorkflowNodes" ADD CONSTRAINT "WorkflowNodes_workflowId_Workflows_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."Workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorkflowNodes" ADD CONSTRAINT "WorkflowNodes_modelConfigId_ModelConfigs_id_fk" FOREIGN KEY ("modelConfigId") REFERENCES "public"."ModelConfigs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorkflowNodes" ADD CONSTRAINT "WorkflowNodes_toolId_Tools_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."Tools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agentTools_agentId_idx" ON "AgentTools" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agentTools_toolId_idx" ON "AgentTools" USING btree ("toolId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_userId_idx" ON "Agents" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_mode_idx" ON "Agents" USING btree ("mode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_modelConfigId_idx" ON "Agents" USING btree ("modelConfigId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_workflowId_idx" ON "Agents" USING btree ("workflowId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apiKeys_userId_idx" ON "ApiKeys" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apiKeys_provider_idx" ON "ApiKeys" USING btree ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatAgents_chatId_idx" ON "ChatAgents" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatAgents_agentId_idx" ON "ChatAgents" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "modelConfigs_userId_idx" ON "ModelConfigs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "modelConfigs_apiKeyId_idx" ON "ModelConfigs" USING btree ("apiKeyId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nodeTools_nodeId_idx" ON "NodeTools" USING btree ("nodeId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nodeTools_toolId_idx" ON "NodeTools" USING btree ("toolId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tools_name_idx" ON "Tools" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tools_category_idx" ON "Tools" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tools_isPublic_idx" ON "Tools" USING btree ("isPublic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowEdges_workflowId_idx" ON "WorkflowEdges" USING btree ("workflowId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowEdges_source_idx" ON "WorkflowEdges" USING btree ("sourceNodeKey");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowEdges_target_idx" ON "WorkflowEdges" USING btree ("targetNodeKey");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowNodes_workflowId_idx" ON "WorkflowNodes" USING btree ("workflowId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowNodes_nodeType_idx" ON "WorkflowNodes" USING btree ("nodeType");