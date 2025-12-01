import { Message } from "ai";

import { auth } from "../../../../app/(auth)/auth";
import { saveChat, getChatById, isUserInChat } from "../../../../db/queries";


export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { chatId, message }: { chatId: string; message: Message } = await request.json();

    if (!chatId || !message) {
      return new Response("Missing chatId or message", { status: 400 });
    }

    // Get existing chat (with latest state to avoid race conditions)
    let existingChat = await getChatById({ id: chatId });

    // If chat doesn't exist, create it (handles race condition where chat creation hasn't completed)
    if (!existingChat) {
      // Create new chat with the first message
      await saveChat({
        id: chatId,
        messages: [message],
        userId: session.user.id || "",
      });
      return Response.json({ success: true });
    }

    // Verify access: for group chats, check membership; for regular chats, check ownership
    const isGroupChat = existingChat.isGroupChat || false;
    if (isGroupChat) {
      // For group chats, user must be a member
      const isMember = await isUserInChat(chatId, session.user.id);
      if (!isMember) {
        return new Response("Forbidden - not a member of this chat", { status: 403 });
      }
    } else {
      // For regular chats, user must be the owner
      if (existingChat.userId !== session.user.id) {
        return new Response("Forbidden - not the owner of this chat", { status: 403 });
      }
    }

    // Parse existing messages
    const messages = (existingChat.messages as Array<Message>) || [];
    
    // Check if message already exists (by id) to prevent duplicates
    const messageExists = messages.some((m) => m.id === message.id);
    if (messageExists) {
      // Message already exists, update it instead
      const updatedMessages = messages.map((m) => 
        m.id === message.id ? { ...m, ...message } : m
      );
      
      await saveChat({
        id: chatId,
        messages: updatedMessages,
        userId: session.user.id,
      });
    } else {
      // Add new message
      const updatedMessages = [...messages, message];

      // Save updated chat
      await saveChat({
        id: chatId,
        messages: updatedMessages,
        userId: session.user.id,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving message:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

