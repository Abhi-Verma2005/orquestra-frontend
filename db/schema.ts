import { Message } from "ai";
import { InferSelectModel, sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  integer,
  boolean,
  index,
  jsonb,
  text,
  unique,
  real,
} from "drizzle-orm/pg-core";

export const users = pgTable("Users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  userId: varchar("userId", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  summary: varchar("summary", { length: 2000 }),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  isGroupChat: boolean("isGroupChat").notNull().default(false),
});

export const session = pgTable("Session", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id, { onDelete: 'cascade' }),
  agentId: uuid("agentId").notNull().references(() => agents.id),
  status: varchar("status", { length: 50 }).notNull().default("running"),
  iterationCount: integer("iterationCount").notNull().default(0),
  workflowState: jsonb("workflowState"),
  executionContext: jsonb("executionContext").notNull().default(sql`'{}'::jsonb`),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index("session_chatId_idx").on(table.chatId),
  agentIdIdx: index("session_agentId_idx").on(table.agentId),
  statusIdx: index("session_status_idx").on(table.status),
}));

export const chatMembers = pgTable("ChatMembers", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id, { onDelete: 'cascade' }),
  userId: varchar("userId", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index("chatMembers_chatId_idx").on(table.chatId),
  userIdIdx: index("chatMembers_userId_idx").on(table.userId),
  uniqueChatUser: index("chatMembers_chatId_userId_idx").on(table.chatId, table.userId),
}));

export const chatInvites = pgTable("ChatInvites", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id, { onDelete: 'cascade' }),
  inviteCode: varchar("inviteCode", { length: 255 }).notNull().unique(),
  createdBy: varchar("createdBy", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt"),
  maxUses: integer("maxUses"),
  usedCount: integer("usedCount").notNull().default(0),
}, (table) => ({
  inviteCodeIdx: index("chatInvites_inviteCode_idx").on(table.inviteCode),
  chatIdIdx: index("chatInvites_chatId_idx").on(table.chatId),
}));

export const messageEmbeddings = pgTable("MessageEmbeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: varchar("messageId", { length: 255 }).notNull(),
  pineconeId: varchar("pineconeId", { length: 255 }).notNull(),
  chunkIndex: integer("chunkIndex").notNull().default(0),
  hash: varchar("hash", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("ready"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// ============================================
// NEW TABLES - AGENTIC SYSTEM
// ============================================

// API Keys (Encrypted, Separate for Security)
export const apiKeys = pgTable("ApiKeys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider", { length: 50 }).notNull(), // "groq" | "openai" | "anthropic"
  encryptedKey: text("encryptedKey").notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  lastUsedAt: timestamp("lastUsedAt"),
}, (table) => ({
  userIdIdx: index("apiKeys_userId_idx").on(table.userId),
  providerIdx: index("apiKeys_provider_idx").on(table.provider),
}));

// Model Configurations (Reusable)
export const modelConfigs = pgTable("ModelConfigs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  apiKeyId: uuid("apiKeyId").notNull().references(() => apiKeys.id),
  temperature: real("temperature").default(0.7),
  maxTokens: integer("maxTokens").default(2000),
  topP: real("topP").default(1.0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("modelConfigs_userId_idx").on(table.userId),
  apiKeyIdIdx: index("modelConfigs_apiKeyId_idx").on(table.apiKeyId),
}));

// Tools Library
export const tools = pgTable("Tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "search" | "code" | "data" | "communication"
  parametersSchema: jsonb("parametersSchema").notNull(),
  implementation: varchar("implementation", { length: 50 }).notNull(), // "builtin" | "webhook" | "sandbox"
  config: jsonb("config"),
  isPublic: boolean("isPublic").notNull().default(true),
  createdBy: varchar("createdBy", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  nameIdx: index("tools_name_idx").on(table.name),
  categoryIdx: index("tools_category_idx").on(table.category),
  isPublicIdx: index("tools_isPublic_idx").on(table.isPublic),
}));

// Workflows (Advanced Mode)
export const workflows = pgTable("Workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Agents (Core Entity)
export const agents = pgTable("Agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  mode: varchar("mode", { length: 50 }).notNull().default("simple"), // "simple" | "advanced"

  // Simple mode fields
  systemPrompt: text("systemPrompt"),
  modelConfigId: uuid("modelConfigId").references(() => modelConfigs.id),

  // Advanced mode field
  workflowId: uuid("workflowId").references(() => workflows.id, { onDelete: 'cascade' }),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("agents_userId_idx").on(table.userId),
  modeIdx: index("agents_mode_idx").on(table.mode),
  modelConfigIdIdx: index("agents_modelConfigId_idx").on(table.modelConfigId),
  workflowIdIdx: index("agents_workflowId_idx").on(table.workflowId),
}));

// Simple Mode: Agent-Tool Mapping
export const agentTools = pgTable("AgentTools", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agentId").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  toolId: uuid("toolId").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  config: jsonb("config"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  agentIdIdx: index("agentTools_agentId_idx").on(table.agentId),
  toolIdIdx: index("agentTools_toolId_idx").on(table.toolId),
  uniqueAgentTool: unique("agentTools_agentId_toolId_unique").on(table.agentId, table.toolId),
}));

// Workflow Nodes (Advanced Mode)
export const workflowNodes = pgTable("WorkflowNodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflowId").notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  nodeKey: varchar("nodeKey", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }),
  nodeType: varchar("nodeType", { length: 50 }).notNull(), // "agent" | "tool" | "conditional"

  // Agent node config
  systemPrompt: text("systemPrompt"),
  modelConfigId: uuid("modelConfigId").references(() => modelConfigs.id),

  // Tool node config
  toolId: uuid("toolId").references(() => tools.id),

  // Conditional node config
  condition: jsonb("condition"),

  // UI position
  position: jsonb("position"),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  workflowIdIdx: index("workflowNodes_workflowId_idx").on(table.workflowId),
  nodeTypeIdx: index("workflowNodes_nodeType_idx").on(table.nodeType),
  uniqueNodeKey: unique("workflowNodes_workflowId_nodeKey_unique").on(table.workflowId, table.nodeKey),
}));

// Workflow Edges (Advanced Mode)
export const workflowEdges = pgTable("WorkflowEdges", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflowId").notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  sourceNodeKey: varchar("sourceNodeKey", { length: 255 }).notNull(),
  targetNodeKey: varchar("targetNodeKey", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }),
  condition: jsonb("condition"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  workflowIdIdx: index("workflowEdges_workflowId_idx").on(table.workflowId),
  sourceIdx: index("workflowEdges_source_idx").on(table.sourceNodeKey),
  targetIdx: index("workflowEdges_target_idx").on(table.targetNodeKey),
}));

// Node-Tool Mapping (Advanced Mode)
export const nodeTools = pgTable("NodeTools", {
  id: uuid("id").primaryKey().defaultRandom(),
  nodeId: uuid("nodeId").notNull().references(() => workflowNodes.id, { onDelete: 'cascade' }),
  toolId: uuid("toolId").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  config: jsonb("config"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  nodeIdIdx: index("nodeTools_nodeId_idx").on(table.nodeId),
  toolIdIdx: index("nodeTools_toolId_idx").on(table.toolId),
  uniqueNodeTool: unique("nodeTools_nodeId_toolId_unique").on(table.nodeId, table.toolId),
}));

// Chat-Agent Assignment
export const chatAgents = pgTable("ChatAgents", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id, { onDelete: 'cascade' }),
  agentId: uuid("agentId").notNull().references(() => agents.id, { onDelete: 'cascade' }),
  isActive: boolean("isActive").notNull().default(true),
  assignedAt: timestamp("assignedAt").notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index("chatAgents_chatId_idx").on(table.chatId),
  agentIdIdx: index("chatAgents_agentId_idx").on(table.agentId),
  uniqueChatAgent: unique("chatAgents_chatId_agentId_unique").on(table.chatId, table.agentId),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type User = InferSelectModel<typeof users>;
export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};
export type Session = InferSelectModel<typeof session>;
export type ChatMember = InferSelectModel<typeof chatMembers>;
export type ChatInvite = InferSelectModel<typeof chatInvites>;
export type MessageEmbedding = InferSelectModel<typeof messageEmbeddings>;

// New type exports
export type ApiKey = InferSelectModel<typeof apiKeys>;
export type ModelConfig = InferSelectModel<typeof modelConfigs>;
export type Tool = InferSelectModel<typeof tools>;
export type Agent = InferSelectModel<typeof agents>;
export type AgentTool = InferSelectModel<typeof agentTools>;
export type Workflow = InferSelectModel<typeof workflows>;
export type WorkflowNode = InferSelectModel<typeof workflowNodes>;
export type WorkflowEdge = InferSelectModel<typeof workflowEdges>;
export type NodeTool = InferSelectModel<typeof nodeTools>;
export type ChatAgent = InferSelectModel<typeof chatAgents>;