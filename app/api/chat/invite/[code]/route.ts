import { getChatInviteByCode } from "@/db/queries";
import { NextRequest, NextResponse } from "next/server";

// GET /api/chat/invite/[code] - Get invite details (public, no auth)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const invite = await getChatInviteByCode(code);

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    // Check if max uses reached
    if (invite.maxUses && invite.usedCount >= invite.maxUses) {
      return NextResponse.json(
        { error: "Invite has reached maximum uses" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      chatId: invite.chatId,
      createdBy: invite.createdBy,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      usedCount: invite.usedCount,
    });
  } catch (error: any) {
    console.error("Error getting invite:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


