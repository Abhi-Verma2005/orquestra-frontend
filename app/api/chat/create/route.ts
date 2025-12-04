import { Message } from "ai";

import { generateChatTitleFromMessages } from "../../../../ai/title";
import { auth } from "../../../../app/(auth)/auth";
import { saveChat, getChatById } from "../../../../db/queries";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { message }: { message: Message } = await request.json();
    if (!message || !message.content) {
      return new Response("Missing message", { status: 400 });
    }

    const id = crypto.randomUUID();

    // Debug: log incoming create-chat request context
    console.log("[CREATE_CHAT_REQUEST]", {
      id,
      userId: session.user.id,
      contentPreview: message.content.slice(0, 80),
    });

    // Generate a title from the first message
    let title: string | undefined = undefined;
    try {
      title = await generateChatTitleFromMessages([message]);
    } catch {}

    await saveChat({
      id,
      messages: [message],
      userId: session.user.id || "",
      title,
    });

    // Debug: immediately verify that the chat is readable from the same DB
    try {
      const verify = await getChatById({ id });
      console.log("[CREATE_CHAT_VERIFY]", {
        id,
        exists: !!verify,
        userId: verify?.userId,
        createdAt: verify?.createdAt,
      });
    } catch (verifyError) {
      console.error("[CREATE_CHAT_VERIFY_ERROR]", verifyError);
    }

    return Response.json({ id, title: title || null });
  } catch (error) {
    console.error("Error creating chat:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

