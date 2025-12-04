import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { searchUsers } from "@/db/queries";

// GET /api/users/search?q=...
// Simple user search by email / id for inviting to chats.
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const users = await searchUsers(q, 10);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
      })),
    });
  } catch (error: any) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}


