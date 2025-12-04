import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import {
  getChatMembers,
  removeChatMember,
  getChatById,
  isUserInChat,
  addChatMember,
} from "@/db/queries";

// GET /api/chat/members?chatId=xxx - Get all members of a chat
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    // Verify user has access to chat
    const hasAccess = await isUserInChat(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await getChatMembers(chatId);

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error("Error getting chat members:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chat/members - Add a member to a chat (owner or existing member)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId, userId } = await request.json();

    if (!chatId || !userId) {
      return NextResponse.json(
        { error: "chatId and userId are required" },
        { status: 400 },
      );
    }

    // Verify current user has access to this chat
    const hasAccess = await isUserInChat(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const member = await addChatMember(chatId, userId, "member");

    return NextResponse.json({ member });
  } catch (error: any) {
    console.error("Error adding chat member:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/chat/members?chatId=xxx&userId=xxx - Remove member (owner only)
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const userId = searchParams.get("userId");

    if (!chatId || !userId) {
      return NextResponse.json(
        { error: "chatId and userId are required" },
        { status: 400 }
      );
    }

    // Verify user is owner of chat
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only chat owner can remove members" },
        { status: 403 }
      );
    }

    // Don't allow removing the owner
    if (userId === chat.userId) {
      return NextResponse.json(
        { error: "Cannot remove chat owner" },
        { status: 400 }
      );
    }

    await removeChatMember(chatId, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing chat member:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


