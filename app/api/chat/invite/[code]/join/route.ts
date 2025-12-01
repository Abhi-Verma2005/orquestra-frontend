import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { redeemInviteCode } from "@/db/queries";

// POST /api/chat/invite/[code]/join - Join chat via invite code
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Use invite code to join chat
    const chat = await redeemInviteCode(code, session.user.id);

    return NextResponse.json({
      chatId: chat.id,
      title: chat.title,
      isGroupChat: chat.isGroupChat,
    });
  } catch (error: any) {
    console.error("Error joining via invite:", error);
    
    // Handle specific error messages
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (error.message?.includes("expired")) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }
    if (error.message?.includes("maximum uses")) {
      return NextResponse.json(
        { error: "Invite has reached maximum uses" },
        { status: 410 }
      );
    }
    if (error.message?.includes("already a member")) {
      return NextResponse.json(
        { error: "You are already a member of this chat" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


