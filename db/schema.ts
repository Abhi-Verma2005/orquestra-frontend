import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// Users table - for authentication
export const users = pgTable("Users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));

export type User = InferSelectModel<typeof users>;

// Chat table - references user ID from main database
export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }), // User ID from main database
  title: varchar("title", { length: 255 }), // Chat title
  summary: varchar("summary", { length: 2000 }), // Summarized older messages
  updatedAt: timestamp("updatedAt").notNull().defaultNow(), // Last update time
  isGroupChat: boolean("isGroupChat").notNull().default(false), // Whether this is a group chat
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};


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
  userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }), // User ID from main database
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
  createdBy: varchar("createdBy", { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }), // User ID who created the invite
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
