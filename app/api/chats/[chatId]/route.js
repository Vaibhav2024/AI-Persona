// app/api/chats/[chatId]/route.js
import { auth } from "@clerk/nextjs/server";
import { verifyChatOwner, getChat, getChatMessages, deleteChat } from "@/lib/chatStore";

export async function GET(req, { params }) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = params;
  const owned = await verifyChatOwner(chatId, userId);
  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [meta, messages] = await Promise.all([
    getChat(chatId),
    getChatMessages(chatId),
  ]);

  return Response.json({ meta, messages });
}

export async function DELETE(req, { params }) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = params;
  const deleted = await deleteChat(chatId, userId);
  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
