// app/page.js
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { listChats } from "@/lib/chatStore";

export default async function RootPage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // If the user has existing chats, redirect to the most recent one
  const chats = await listChats(userId);
  if (chats.length > 0) {
    redirect(`/chat/${chats[0].id}`);
  }

  // No chats yet — go to the new-chat landing
  redirect("/chat");
}
