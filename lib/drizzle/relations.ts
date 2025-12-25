import { relations } from "drizzle-orm/relations";
import { chat, chatInvites, chatMembers, executionPlan, planStep, sessionState } from "./schema";

export const chatInvitesRelations = relations(chatInvites, ({one}) => ({
	chat: one(chat, {
		fields: [chatInvites.chatId],
		references: [chat.id]
	}),
}));

export const chatRelations = relations(chat, ({many}) => ({
	chatInvites: many(chatInvites),
	chatMembers: many(chatMembers),
	executionPlans: many(executionPlan),
	sessionStates: many(sessionState),
}));

export const chatMembersRelations = relations(chatMembers, ({one}) => ({
	chat: one(chat, {
		fields: [chatMembers.chatId],
		references: [chat.id]
	}),
}));

export const executionPlanRelations = relations(executionPlan, ({one, many}) => ({
	chat: one(chat, {
		fields: [executionPlan.chatId],
		references: [chat.id]
	}),
	planSteps: many(planStep),
}));

export const planStepRelations = relations(planStep, ({one}) => ({
	executionPlan: one(executionPlan, {
		fields: [planStep.planId],
		references: [executionPlan.id]
	}),
}));

export const sessionStateRelations = relations(sessionState, ({one}) => ({
	chat: one(chat, {
		fields: [sessionState.chatId],
		references: [chat.id]
	}),
}));