import { CoreMessage, Message } from "ai";
import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { getChatById, isUserInChat } from "@/db/queries";
import { Chat } from "@/db/schema";
import { ChatContainer as PreviewChat } from "@/features/chat";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('Chat id from params: ', id)
  const chatFromDb = await getChatById({ id });


  if (!chatFromDb) {
    console.log(`[DEBUG] Chat not found in DB for ID: ${id}`);
    notFound();
  }

  const dbMessages = chatFromDb.messages as Array<Message | CoreMessage>;

  console.log('Raw messages from DB:', JSON.stringify(dbMessages, null, 2));

  // Always use convertToUIMessages to ensure backend tool_calls are converted to frontend toolInvocations
  const messages = convertToUIMessages(dbMessages as Array<CoreMessage>);

  console.log('Converted messages:', JSON.stringify(messages, null, 2));

  // type casting and converting messages to UI messages
  const chat: Chat = {
    ...chatFromDb,
    messages,
  };

  console.log(chat)

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    console.log(`[DEBUG] No session or user found for chat ID: ${chat.id}`);
    return notFound();
  }

  // Check if user is owner OR member
  const hasAccess = await isUserInChat(chat.id, session.user.id);
  if (!hasAccess) {
    console.log(`[DEBUG] User ${session.user.id} does not have access to chat ID: ${chat.id}`);
    return notFound();
  }

  return <PreviewChat id={chat.id} initialMessages={chat.messages} user={session.user} />;
}
