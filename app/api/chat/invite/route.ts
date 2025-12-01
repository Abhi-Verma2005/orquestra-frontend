import { auth } from "@/app/(auth)/auth";
import { createChatInvite, getChatById, isUserInChat } from "@/db/queries";
import { NextRequest, NextResponse } from "next/server";

// POST /api/chat/invite - Generate invite link for a chat
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId, expiresAt, maxUses } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    // Verify user owns chat or is member
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const hasAccess = await isUserInChat(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create invite
    const invite = await createChatInvite({
      chatId,
      createdBy: session.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
    });

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/chat/join?invite=${invite.inviteCode}`;

    return NextResponse.json({
      inviteCode: invite.inviteCode,
      inviteUrl,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      usedCount: invite.usedCount,
    });
  } catch (error: any) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


