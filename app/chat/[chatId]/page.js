// app/chat/[chatId]/page.js
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { verifyChatOwner, getChat, getChatMessages, listChats } from "@/lib/chatStore";
import ChatLayout from "@/components/ChatLayout";

export default async function ChatPage({ params }) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const { chatId } = params;

  // Server-side ownership check — never trust client
  const owned = await verifyChatOwner(chatId, userId);
  if (!owned) redirect("/chat");

  const [chatMeta, initialMessages, chats] = await Promise.all([
    getChat(chatId),
    getChatMessages(chatId),
    listChats(userId),
  ]);

  return (
    <ChatLayout
      chats={chats}
      activeChatId={chatId}
      chatMeta={chatMeta}
      initialMessages={initialMessages}
    />
  );
}
