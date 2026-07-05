// app/api/chat/route.js
import { auth } from "@clerk/nextjs/server";
import { hiteshSystemPrompt, hiteshFewShotMessages } from "@/prompts/hitesh";
import { piyushSystemPrompt, piyushFewShotMessages } from "@/prompts/piyush";
import { searchPersonaVideos } from "@/lib/youtube";
import { askOpenAI } from "@/lib/openai";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  verifyChatOwner,
  getChatMessages,
  appendMessages,
  setChatTitle,
  getChat,
} from "@/lib/chatStore";

const PERSONAS = {
  hitesh: { system: hiteshSystemPrompt, fewShot: hiteshFewShotMessages },
  piyush: { system: piyushSystemPrompt, fewShot: piyushFewShotMessages },
};

const MAX_HISTORY_MESSAGES = 10;

const RATE_LIMIT_RESPONSES = {
  hitesh:
    "Dekho yaar, load mat lo par abhi limits lag chuki hain. Obvious si baat hai, system resources limited hote hain. Thodi der baad aana, tab tak chai piyo aur rest karo. Chalo ji, milte hain thodi der mein!",
  piyush:
    "So yaar, rate limit hit ho chuki hai, right? Depends upon use case and high traffic. Please personally mat lena yaar, par abhi server limit exhaust ho chuki hai. Phir se check karte hain baad mein, right? That's it!",
};

const CHAR_LIMIT_RESPONSES = {
  hitesh:
    "Dekho yaar, load mat lo par itna lamba message mat likho. Seedhi baat hai, maximum 500 characters mein short and sweet question poocho, ho jaata hai. Chai piyo aur thoda short karke batao!",
  piyush:
    "So yaar, characters limits cross ho gayi hai, right? Depends upon prompt size, 500 characters max limit hai. Dil pe mat lena, par message thoda chota karo please, right? That's it!",
};

export async function POST(req) {
  try {
    // 1. Authenticate — Clerk v5 auth() is synchronous
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate Limiting Check
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateLimitCheck = await checkRateLimit(ip);

    const { chatId, userMessage, tone } = await req.json();

    if (!chatId || !userMessage) {
      return Response.json(
        { error: "chatId and userMessage are required" },
        { status: 400 }
      );
    }

    // 3. Verify chat ownership server-side — never trust userId from client
    const owned = await verifyChatOwner(chatId, userId);
    if (!owned) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    // 4. Load chat meta to get persona
    const meta = await getChat(chatId);
    const persona = meta.persona;
    const config = PERSONAS[persona];
    if (!config) {
      return Response.json({ error: "Invalid persona" }, { status: 400 });
    }

    // 5. User Message Input Validation (Max 500 characters)
    if (userMessage.length > 500) {
      const charLimitReply =
        CHAR_LIMIT_RESPONSES[persona] ||
        "Message exceeds character limit of 500.";
      return Response.json({ reply: charLimitReply, videos: [] });
    }

    if (!rateLimitCheck.success) {
      const friendlyReply =
        RATE_LIMIT_RESPONSES[persona] ||
        "Rate limit hit. Please try again later.";
      return Response.json({ reply: friendlyReply, videos: [], limitHit: true });
    }

    // 6. Load ONLY this chat's stored messages — never mix other chats
    const storedMessages = await getChatMessages(chatId);

    // 7. If this is the first real message, set chat title
    const isFirstMessage = storedMessages.length === 0;
    if (isFirstMessage) {
      await setChatTitle(chatId, userMessage.trim());
    }

    // 8. Trim history to last 10 messages from this chat only
    const trimmedHistory = storedMessages.slice(-MAX_HISTORY_MESSAGES);

    // 9. Append current user message to trimmed history for the OpenAI call
    const newUserMessage = { role: "user", content: userMessage };
    const conversationForAI = [...trimmedHistory, newUserMessage];

    // 10. Build system prompt — inject tone if sarcastic
    let systemPrompt = config.system;
    if (tone === "sarcastic") {
      systemPrompt =
        systemPrompt +
        "\n\nIMPORTANT: The user has selected SARCASTIC mode. Amp up the wit, dry humour, and playful teasing — stay in character but be noticeably more sarcastic and cheeky than usual.";
    }

    // 11. Construct message history for OpenAI
    const openaiInputMessages = [...config.fewShot, ...conversationForAI];

    // 12. Call OpenAI API
    let reply = "";
    try {
      reply = await askOpenAI({
        systemPrompt,
        messages: openaiInputMessages,
      });
    } catch (err) {
      console.error("OpenAI API call failed:", err);
      return Response.json(
        { error: "Failed to query the AI persona. Please try again." },
        { status: 500 }
      );
    }

    // 13. Look for a trailing {"search_youtube": "..."} tag and strip it
    let videos = [];
    const searchMatch = reply.match(/\{"search_youtube":\s*"([^"]+)"\}/);
    if (searchMatch) {
      const query = searchMatch[1];
      reply = reply.replace(searchMatch[0], "").trim();
      videos = await searchPersonaVideos(query, persona);

      if (videos.length === 0) {
        reply = reply
          .replace(/(?:video\s+(?:dekh|check)\s+(?:kar\s+)?lena\s*,?\s*(?:aur\s+)?(?:channel\s+ko\s+)?subscribe\s+karna\s+mat\s+bhoolna[.!]?)/gi, "")
          .replace(/(?:video\s+(?:dekh|check)\s+(?:kar\s+)?lena[.!]?)/gi, "")
          .replace(/(?:channel\s+ko\s+)?subscribe\s+karna\s+mat\s+bhoolna[.!]?/gi, "")
          .replace(/^[.,\s]+/g, "")
          .replace(/[.,\s]+$/g, "")
          .trim();
      }
    }

    // 14. Persist both messages to Redis (scoped to this chatId only)
    await appendMessages(chatId, [
      { role: "user", content: userMessage },
      { role: "assistant", content: reply, videos },
    ]);

    return Response.json({ reply, videos });
  } catch (error) {
    console.error("Chat route handler error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
