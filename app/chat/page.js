// app/chat/page.js
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { listChats } from "@/lib/chatStore";
import ChatLayout from "@/components/ChatLayout";

export default async function ChatLandingPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const chats = await listChats(userId);

  return <ChatLayout chats={chats} activeChatId={null} chatMeta={null} initialMessages={[]} />;
}
