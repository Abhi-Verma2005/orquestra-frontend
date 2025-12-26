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
} from "drizzle-orm/pg-core";

// Users table - for authentication
export const users = pgTable("Users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof users>;

// Chat table - references external user ID (no foreign key constraint)
export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: jsonb("messages")
  .notNull()
  .default(sql`'[]'::jsonb`),
  userId: varchar("userId", { length: 255 }).notNull(), // External user ID from external database
  title: varchar("title", { length: 255 }), // Chat title
  summary: varchar("summary", { length: 2000 }), // Summarized older messages
  updatedAt: timestamp("updatedAt").notNull().defaultNow(), // Last update time
  isGroupChat: boolean("isGroupChat").notNull().default(false), // Whether this is a group chat
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

// Execution Plan table
export const executionPlan = pgTable("ExecutionPlan", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id, { onDelete: 'cascade' }),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, completed, cancelled
  summary: varchar("summary", { length: 500 }),
  currentStepIndex: integer("currentStepIndex").notNull().default(0),
  totalSteps: integer("totalSteps").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Plan Step table
export const planStep = pgTable("PlanStep", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("planId").notNull().references(() => executionPlan.id, { onDelete: 'cascade' }),
  stepIndex: integer("stepIndex").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  toolName: varchar("toolName", { length: 100 }).notNull(), // Tool to call for this step
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, executing, completed, failed
  result: json("result"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  completedAt: timestamp("completedAt"),
});

export type ExecutionPlan = InferSelectModel<typeof executionPlan>;
export type PlanStep = InferSelectModel<typeof planStep>;

// Message Embeddings tracking table
export const messageEmbeddings = pgTable("MessageEmbeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: varchar("messageId", { length: 255 }).notNull(),
  pineconeId: varchar("pineconeId", { length: 255 }).notNull(),
  chunkIndex: integer("chunkIndex").notNull().default(0),
  hash: varchar("hash", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("ready"), // pending | ready | failed
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Chat Members table - tracks all users in a chat
export const chatMembers = pgTable("ChatMembers", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id, { onDelete: 'cascade' }),
  userId: varchar("userId", { length: 255 }).notNull(), // External user ID
  role: varchar("role", { length: 50 }).notNull().default("member"), // 'owner' | 'member'
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index("chatMembers_chatId_idx").on(table.chatId),
  userIdIdx: index("chatMembers_userId_idx").on(table.userId),
  uniqueChatUser: index("chatMembers_chatId_userId_idx").on(table.chatId, table.userId),
}));

// Chat Invites table - tracks invite links for chats
export const chatInvites = pgTable("ChatInvites", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id, { onDelete: 'cascade' }),
  inviteCode: varchar("inviteCode", { length: 255 }).notNull().unique(),
  createdBy: varchar("createdBy", { length: 255 }).notNull(), // User ID who created the invite
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt"), // Nullable - if null, never expires
  maxUses: integer("maxUses"), // Nullable - if null, unlimited uses
  usedCount: integer("usedCount").notNull().default(0),
}, (table) => ({
  inviteCodeIdx: index("chatInvites_inviteCode_idx").on(table.inviteCode),
  chatIdIdx: index("chatInvites_chatId_idx").on(table.chatId),
}));

export type ChatMember = InferSelectModel<typeof chatMembers>;
export type ChatInvite = InferSelectModel<typeof chatInvites>;

// Teaching Session State table
export const sessionState = pgTable("SessionState", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id, { onDelete: 'cascade' }),
  userId: varchar("userId", { length: 255 }).notNull(),
  currentStep: varchar("currentStep", { length: 50 }).notNull(),
  topic: varchar("topic", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index("sessionState_chatId_idx").on(table.chatId),
  userIdIdx: index("sessionState_userId_idx").on(table.userId),
}));

export type SessionStateRow = Omit<InferSelectModel<typeof sessionState>, "state"> & {
  state: Record<string, unknown>;
};
