import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getChatById } from "@/db/queries";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Safely access isGroupChat - it might not exist if migration hasn't run
    const isGroupChat = (chat as any).isGroupChat ?? false;

    return NextResponse.json({
      id: chat.id,
      userId: chat.userId,
      isGroupChat,
      title: chat.title,
    });
  } catch (error: any) {
    console.error("Error getting chat info:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Internal server error", details: process.env.NODE_ENV === "development" ? error.stack : undefined },
      { status: 500 }
    );
  }
}


