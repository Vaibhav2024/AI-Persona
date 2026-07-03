// app/api/chat/route.js
import { hiteshSystemPrompt, hiteshFewShotMessages } from "@/prompts/hitesh";
import { piyushSystemPrompt, piyushFewShotMessages } from "@/prompts/piyush";
import { searchPersonaVideos } from "@/lib/youtube";
import { askOpenAI } from "@/lib/openai";
import { checkRateLimit } from "@/lib/ratelimit";

const PERSONAS = {
  hitesh: { system: hiteshSystemPrompt, fewShot: hiteshFewShotMessages },
  piyush: { system: piyushSystemPrompt, fewShot: piyushFewShotMessages },
};

const MAX_HISTORY_MESSAGES = 10;

const RATE_LIMIT_RESPONSES = {
  hitesh: "Dekho yaar, load mat lo par abhi limits lag chuki hain. Obvious si baat hai, system resources limited hote hain. Thodi der baad aana, tab tak chai piyo aur rest karo. Chalo ji, milte hain thodi der mein!",
  piyush: "So yaar, rate limit hit ho chuki hai, right? Depends upon use case and high traffic. Please personally mat lena yaar, par abhi server limit exhaust ho chuki hai. Phir se check karte hain baad mein, right? That's it!",
};

const CHAR_LIMIT_RESPONSES = {
  hitesh: "Dekho yaar, load mat lo par itna lamba message mat likho. Seedhi baat hai, maximum 500 characters mein short and sweet question poocho, ho jaata hai. Chai piyo aur thoda short karke batao!",
  piyush: "So yaar, characters limits cross ho gayi hai, right? Depends upon prompt size, 500 characters max limit hai. Dil pe mat lena, par message thoda chota karo please, right? That's it!",
};

export async function POST(req) {
  try {
    // 2. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateLimitCheck = await checkRateLimit(ip);

    const { persona, messages } = await req.json();

    const config = PERSONAS[persona];
    if (!config) {
      return Response.json({ error: "Invalid persona" }, { status: 400 });
    }

    // 3. User Message Input Validation (Max 500 characters)
    const latestMessage = messages[messages.length - 1]?.content || "";
    if (latestMessage.length > 500) {
      const charLimitReply = CHAR_LIMIT_RESPONSES[persona] || "Message exceeds character limit of 500.";
      return Response.json({ reply: charLimitReply, videos: [] });
    }

    if (!rateLimitCheck.success) {
      // Return a friendly in-character error response when limit is hit
      const friendlyReply = RATE_LIMIT_RESPONSES[persona] || "Rate limit hit. Please try again later.";
      return Response.json({ reply: friendlyReply, videos: [], limitHit: true });
    }

    // 4. History Trim (last 10 messages)
    const trimmedHistory = messages.slice(-MAX_HISTORY_MESSAGES);

    // 5. Construct message history for OpenAI
    const openaiInputMessages = [...config.fewShot, ...trimmedHistory];

    // 6. Call OpenAI API
    let reply = "";
    try {
      reply = await askOpenAI({
        systemPrompt: config.system,
        messages: openaiInputMessages,
      });
    } catch (err) {
      console.error("OpenAI API call failed:", err);
      return Response.json({ error: "Failed to query the AI persona. Please try again." }, { status: 500 });
    }

    // 7. Look for a trailing {"search_youtube": "..."} line and strip it from the reply
    let videos = [];
    const searchMatch = reply.match(/\{"search_youtube":\s*"([^"]+)"\}/);
    if (searchMatch) {
      const query = searchMatch[1];
      reply = reply.replace(searchMatch[0], "").trim();
      videos = await searchPersonaVideos(query, persona);
    }

    return Response.json({ reply, videos });
  } catch (error) {
    console.error("Chat route handler error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
