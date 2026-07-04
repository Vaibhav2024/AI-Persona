// app/api/chats/route.js
import { auth } from "@clerk/nextjs/server";
import { createChat, listChats } from "@/lib/chatStore";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chats = await listChats(userId);
    return Response.json({ chats });
  } catch (error) {
    console.error("GET /api/chats error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { persona } = await req.json();
    if (!["hitesh", "piyush"].includes(persona)) {
      return Response.json({ error: "Invalid persona" }, { status: 400 });
    }

    const chatId = await createChat(userId, persona);
    return Response.json({ chatId });
  } catch (error) {
    console.error("POST /api/chats error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
