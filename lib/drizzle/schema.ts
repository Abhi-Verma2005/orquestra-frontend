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
} from "drizzle-orm/pg-core";

// Users table - unchanged
export const users = pgTable("Users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Chat table - unchanged, messages stay here
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
  status: varchar("status", { length: 50 }).notNull().default("running"),
  state: jsonb("state").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index("session_chatId_idx").on(table.chatId),
}));

// Chat Members - unchanged
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

// Chat Invites - unchanged
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

// Message Embeddings - unchanged
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

export type User = InferSelectModel<typeof users>;
export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};
export type Session = InferSelectModel<typeof session>;
export type ChatMember = InferSelectModel<typeof chatMembers>;
export type ChatInvite = InferSelectModel<typeof chatInvites>;
