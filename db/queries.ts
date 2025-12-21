import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq, and, sql, or, lt, gte, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { chat, chatMembers, chatInvites, users } from "./schema";

// Native database connection
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
let db = drizzle(client);

export async function getUser(email: string) {
  try {
    return await db.select().from(users).where(eq(users.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  } catch (error) {
    console.error("Failed to get user by ID from database");
    throw error;
  }
}

// Search users by email (and optionally by ID) for inviting to chats.
// NOTE: This intentionally returns only basic fields (id, email).
export async function searchUsers(query: string, limit: number = 10) {
  try {
    const q = `%${query}%`;
    return await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(
        or(
          ilike(users.email, q),
          ilike(users.id, q),
        ),
      )
      .limit(limit);
  } catch (error) {
    console.error("Failed to search users", error);
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  try {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    
    // Generate a UUID for the user ID
    const userId = crypto.randomUUID();
    
    return await db.insert(users).values({
      id: userId,
      email,
      password: hash,
    });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
  title,
  summary,
}: {
  id: string;
  messages: any;
  userId: string;
  title?: string;
  summary?: string;
}) {
  try {
    const messagesJson = JSON.stringify(messages);
    const now = new Date();

    const updateData: any = {
      messages: messagesJson,
      updatedAt: now,
    };
    
    if (title !== undefined) {
      updateData.title = title;
    }
    
    if (summary !== undefined) {
      updateData.summary = summary;
    }

    // Optimistic approach: try insert first (faster for new chats)
    // If it fails due to duplicate key (race condition), fall back to update
    try {

      const inserted = await db.insert(chat).values({
        id,
        createdAt: now,
        updatedAt: now,
        messages: messagesJson as any,
        userId,
        title: title || null,
        summary: summary || null,
      }).returning();

      console.log(inserted)


      return inserted;
    } catch (insertError: any) {

      // Check if it's a duplicate key error (PostgreSQL error code 23505)
      const isDuplicateKey = 
        insertError?.code === '23505' ||
        insertError?.severity === 'ERROR' ||
        (typeof insertError?.message === 'string' && 
         insertError.message.includes('duplicate key') &&
         insertError.message.includes('Chat_pkey'));

      if (isDuplicateKey) {
        // Chat was created by another request (race condition), update instead

        const updated = await db
          .update(chat)
          .set(updateData)
          .where(eq(chat.id, id));


        return updated;
      }
      // Re-throw if it's a different error
      throw insertError;
    }
  } catch (error) {
    console.error("Failed to save chat in database", error);
    throw error;
  }
}

export async function updateChatSummary({
  id,
  summary,
}: {
  id: string;
  summary: string;
}) {
  try {
    return await db
      .update(chat)
      .set({
        summary,
        updatedAt: new Date(),
      })
      .where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to update chat summary");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    // Get chats where user is owner
    const ownedChats = await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id));
    
    // Try to get chats where user is a member (table might not exist if migration hasn't run)
    let memberChats: Array<{ chat: any }> = [];
    try {
      memberChats = await db
        .select({ chat: chat })
        .from(chatMembers)
        .innerJoin(chat, eq(chatMembers.chatId, chat.id))
        .where(eq(chatMembers.userId, id));
    } catch (memberError: any) {
      // If chatMembers table doesn't exist, just return owned chats
      if (memberError?.message?.includes("does not exist") || memberError?.code === "42P01") {
        console.warn("chatMembers table not found, returning only owned chats");
        return ownedChats.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      throw memberError;
    }
    
    // Combine and deduplicate by chat ID
    const allChats = [
      ...ownedChats,
      ...memberChats.map(m => m.chat)
    ];
    
    // Remove duplicates and sort by createdAt
    const uniqueChats = Array.from(
      new Map(allChats.map(c => [c.id, c])).values()
    ).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return uniqueChats;
  } catch (error) {
    console.error("Failed to get chats by user from database", error);
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

// Group chat member functions
export async function getChatMembers(chatId: string) {
  try {
    return await db
      .select()
      .from(chatMembers)
      .where(eq(chatMembers.chatId, chatId))
      .orderBy(chatMembers.joinedAt);
  } catch (error) {
    console.error("Failed to get chat members");
    throw error;
  }
}

export async function addChatMember(chatId: string, userId: string, role: "owner" | "member" = "member") {
  try {
    // Check if member already exists
    const existing = await db
      .select()
      .from(chatMembers)
        .where(and(
        eq(chatMembers.chatId, chatId),
        eq(chatMembers.userId, userId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0]; // Already a member
    }
    
    const [member] = await db
      .insert(chatMembers)
        .values({
        chatId,
        userId,
        role,
        joinedAt: new Date(),
        })
        .returning();

    // Mark chat as group chat if not already
    await db
      .update(chat)
      .set({ isGroupChat: true })
      .where(eq(chat.id, chatId));
    
    return member;
  } catch (error) {
    console.error("Failed to add chat member");
    throw error;
  }
}

export async function removeChatMember(chatId: string, userId: string) {
  try {
    return await db
      .delete(chatMembers)
      .where(and(
        eq(chatMembers.chatId, chatId),
        eq(chatMembers.userId, userId)
      ));
  } catch (error) {
    console.error("Failed to remove chat member");
    throw error;
  }
}

export async function isUserInChat(chatId: string, userId: string): Promise<boolean> {
  try {
    // Check if user is owner
    const chatRecord = await db
      .select()
      .from(chat)
      .where(and(
        eq(chat.id, chatId),
        eq(chat.userId, userId)
      ))
      .limit(1);

    if (chatRecord.length > 0) {
      return true;
    }
    
    // Check if user is member
    const member = await db
      .select()
      .from(chatMembers)
      .where(and(
        eq(chatMembers.chatId, chatId),
        eq(chatMembers.userId, userId)
      ))
      .limit(1);

    return member.length > 0;
  } catch (error) {
    console.error("Failed to check if user is in chat");
    throw error;
  }
}

// Invite functions
export async function createChatInvite({
  chatId,
  createdBy,
  expiresAt,
  maxUses,
}: {
  chatId: string;
  createdBy: string;
  expiresAt?: Date;
  maxUses?: number;
}) {
  try {
    // Generate unique invite code
    const inviteCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    
    const [invite] = await db
      .insert(chatInvites)
      .values({
        chatId,
        inviteCode,
        createdBy,
        createdAt: new Date(),
        expiresAt: expiresAt || null,
        maxUses: maxUses || null,
        usedCount: 0,
      })
      .returning();
    
    return invite;
  } catch (error) {
    console.error("Failed to create chat invite");
    throw error;
  }
}

export async function getChatInviteByCode(inviteCode: string) {
  try {
    const [invite] = await db
      .select()
      .from(chatInvites)
      .where(eq(chatInvites.inviteCode, inviteCode))
      .limit(1);

    return invite || null;
  } catch (error) {
    console.error("Failed to get chat invite by code");
    throw error;
  }
}

export async function redeemInviteCode(inviteCode: string, userId: string) {
  try {
    return await db.transaction(async (tx) => {
      // Get invite
      const [invite] = await tx
        .select()
        .from(chatInvites)
        .where(eq(chatInvites.inviteCode, inviteCode))
        .limit(1);
      
      if (!invite) {
        throw new Error("Invite not found");
      }
      
      // Check if expired
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        throw new Error("Invite has expired");
      }
      
      // Check if max uses reached
      if (invite.maxUses && invite.usedCount >= invite.maxUses) {
        throw new Error("Invite has reached maximum uses");
      }
      
      // Check if user is already a member (check both owner and member)
      const chatRecord = await tx
        .select()
        .from(chat)
        .where(and(
          eq(chat.id, invite.chatId),
          eq(chat.userId, userId)
        ))
        .limit(1);
      
      if (chatRecord.length > 0) {
        throw new Error("User is already a member of this chat");
      }
      
      const existingMember = await tx
        .select()
        .from(chatMembers)
        .where(and(
          eq(chatMembers.chatId, invite.chatId),
          eq(chatMembers.userId, userId)
        ))
        .limit(1);
      
      if (existingMember.length > 0) {
        throw new Error("User is already a member of this chat");
      }
      
      // Add user to chat members
      await tx
        .insert(chatMembers)
        .values({
          chatId: invite.chatId,
          userId,
          role: "member",
          joinedAt: new Date(),
        });
      
      // Mark chat as group chat
      await tx
        .update(chat)
        .set({ isGroupChat: true })
        .where(eq(chat.id, invite.chatId));
      
      // Increment used count
      await tx
        .update(chatInvites)
        .set({ usedCount: invite.usedCount + 1 })
        .where(eq(chatInvites.id, invite.id));
      
      // Get chat details
      const [chatResult] = await tx
        .select()
        .from(chat)
        .where(eq(chat.id, invite.chatId))
        .limit(1);
      
      return chatResult;
    });
  } catch (error) {
    console.error("Failed to use invite code");
    throw error;
  }
}

