import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, integer, timestamp, unique, json, boolean, index, foreignKey, jsonb } from "drizzle-orm/pg-core"





export const messageEmbeddings = pgTable("MessageEmbeddings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	messageId: varchar({ length: 255 }).notNull(),
	pineconeId: varchar({ length: 255 }).notNull(),
	chunkIndex: integer().default(0).notNull(),
	hash: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('ready').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("Users", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		usersEmailUnique: unique("Users_email_unique").on(table.email),
	}
});

export const chat = pgTable("Chat", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	messages: jsonb("messages")
	.notNull()
	.default(sql`'[]'::jsonb`),
	userId: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }),
	summary: varchar({ length: 2000 }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	isGroupChat: boolean().default(false).notNull(),
});

export const chatInvites = pgTable("ChatInvites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	inviteCode: varchar({ length: 255 }).notNull(),
	createdBy: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	maxUses: integer(),
	usedCount: integer().default(0).notNull(),
},
(table) => {
	return {
		chatInvitesChatIdIdx: index("chatInvites_chatId_idx").using("btree", table.chatId.asc().nullsLast()),
		chatInvitesInviteCodeIdx: index("chatInvites_inviteCode_idx").using("btree", table.inviteCode.asc().nullsLast()),
		chatInvitesChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "ChatInvites_chatId_Chat_id_fk"
		}).onDelete("cascade"),
		chatInvitesInviteCodeUnique: unique("ChatInvites_inviteCode_unique").on(table.inviteCode),
	}
});

export const chatMembers = pgTable("ChatMembers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).default('member').notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		chatMembersChatIdIdx: index("chatMembers_chatId_idx").using("btree", table.chatId.asc().nullsLast()),
		chatMembersChatIdUserIdIdx: index("chatMembers_chatId_userId_idx").using("btree", table.chatId.asc().nullsLast(), table.userId.asc().nullsLast()),
		chatMembersUserIdIdx: index("chatMembers_userId_idx").using("btree", table.userId.asc().nullsLast()),
		chatMembersChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "ChatMembers_chatId_Chat_id_fk"
		}).onDelete("cascade"),
	}
});

export const executionPlan = pgTable("ExecutionPlan", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	status: varchar({ length: 50 }).default('active').notNull(),
	summary: varchar({ length: 500 }),
	currentStepIndex: integer().default(0).notNull(),
	totalSteps: integer().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		executionPlanChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "ExecutionPlan_chatId_Chat_id_fk"
		}).onDelete("cascade"),
	}
});

export const planStep = pgTable("PlanStep", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	planId: uuid().notNull(),
	stepIndex: integer().notNull(),
	description: varchar({ length: 500 }).notNull(),
	toolName: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	result: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp({ mode: 'string' }),
},
(table) => {
	return {
		planStepPlanIdExecutionPlanIdFk: foreignKey({
			columns: [table.planId],
			foreignColumns: [executionPlan.id],
			name: "PlanStep_planId_ExecutionPlan_id_fk"
		}).onDelete("cascade"),
	}
});

export const sessionState = pgTable("SessionState", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	currentStep: varchar({ length: 50 }).notNull(),
	topic: varchar({ length: 255 }),
	state: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		sessionStateChatIdIdx: index("sessionState_chatId_idx").using("btree", table.chatId.asc().nullsLast()),
		sessionStateUserIdIdx: index("sessionState_userId_idx").using("btree", table.userId.asc().nullsLast()),
		sessionStateChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "SessionState_chatId_Chat_id_fk"
		}).onDelete("cascade"),
	}
});