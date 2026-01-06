import { relations } from "drizzle-orm/relations";

import { chat, chatInvites, chatMembers } from "./schema";

export const chatInvitesRelations = relations(chatInvites, ({one}) => ({
	chat: one(chat, {
		fields: [chatInvites.chatId],
		references: [chat.id]
	}),
}));

export const chatRelations = relations(chat, ({many}) => ({
	chatInvites: many(chatInvites),
	chatMembers: many(chatMembers),
}));

export const chatMembersRelations = relations(chatMembers, ({one}) => ({
	chat: one(chat, {
		fields: [chatMembers.chatId],
		references: [chat.id]
	}),
}));

