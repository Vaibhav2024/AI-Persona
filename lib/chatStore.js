// lib/chatStore.js
import { redis } from "./redis";
import { randomUUID } from "crypto";

const MAX_CHATS_PER_USER = 100;

export async function createChat(userId, persona) {
  const chatId = randomUUID();
  const now = Date.now();

  const meta = {
    id: chatId,
    userId,
    persona,
    title: "",
    tone: "normal",
    createdAt: now,
    updatedAt: now,
  };

  await redis.hset(`chat:${chatId}:meta`, meta);
  await redis.lpush(`chats:${userId}`, chatId);
  await redis.ltrim(`chats:${userId}`, 0, MAX_CHATS_PER_USER - 1);

  return chatId;
}

export async function listChats(userId) {
  const chatIds = await redis.lrange(`chats:${userId}`, 0, 49);
  if (!chatIds || chatIds.length === 0) return [];

  const metas = await Promise.all(
    chatIds.map((id) => redis.hgetall(`chat:${id}:meta`))
  );

  return metas
    .filter(Boolean)
    .map((m) => ({
      id: m.id,
      persona: m.persona,
      title: m.title || "New chat",
      tone: m.tone || "normal",
      createdAt: Number(m.createdAt),
      updatedAt: Number(m.updatedAt),
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getChat(chatId) {
  const meta = await redis.hgetall(`chat:${chatId}:meta`);
  if (!meta) return null;
  return {
    id: meta.id,
    userId: meta.userId,
    persona: meta.persona,
    title: meta.title || "New chat",
    tone: meta.tone || "normal",
    createdAt: Number(meta.createdAt),
    updatedAt: Number(meta.updatedAt),
  };
}

export async function getChatMessages(chatId) {
  const raw = await redis.get(`chat:${chatId}:messages`);
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  // Upstash auto-parses JSON
  return Array.isArray(raw) ? raw : [];
}

export async function appendMessages(chatId, messages) {
  const existing = await getChatMessages(chatId);
  const updated = [...existing, ...messages];
  await redis.set(`chat:${chatId}:messages`, JSON.stringify(updated));
  await redis.hset(`chat:${chatId}:meta`, { updatedAt: Date.now() });
}

export async function setChatTitle(chatId, title) {
  const truncated = title.slice(0, 40);
  await redis.hset(`chat:${chatId}:meta`, { title: truncated });
}

export async function setChatTone(chatId, tone) {
  await redis.hset(`chat:${chatId}:meta`, { tone });
}

export async function verifyChatOwner(chatId, userId) {
  const meta = await redis.hgetall(`chat:${chatId}:meta`);
  return meta && meta.userId === userId;
}

export async function deleteChat(chatId, userId) {
  const owned = await verifyChatOwner(chatId, userId);
  if (!owned) return false;
  await redis.del(`chat:${chatId}:meta`);
  await redis.del(`chat:${chatId}:messages`);
  await redis.lrem(`chats:${userId}`, 0, chatId);
  return true;
}
