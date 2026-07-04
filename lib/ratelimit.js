// lib/ratelimit.js
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "https://mock-redis.upstash.io" &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== "mock-token";

const redis = isUpstashConfigured
  ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  : null;

// IP rate limit: 10 messages per 1 hour
export const ipLimiter = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(35, "1 h"),
    analytics: true,
    prefix: "ratelimit:ip",
  })
  : null;

// Global rate limit: 300 messages per 24 hours
export const globalLimiter = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, "24 h"),
    analytics: true,
    prefix: "ratelimit:global",
  })
  : null;

/**
 * Checks both IP and Global rate limits.
 * @param {string} ip The client's IP address
 * @returns {Promise<{success: boolean, limit?: 'ip' | 'global'}>}
 */
export async function checkRateLimit(ip) {
  if (!isUpstashConfigured) {
    // If Redis is not configured, bypass rate limiting to facilitate local development.
    return { success: true };
  }

  try {
    // 1. Check Global Limit
    const globalRes = await globalLimiter.limit("global_limit_key");
    if (!globalRes.success) {
      return { success: false, limit: "global" };
    }

    // 2. Check IP Limit
    const ipRes = await ipLimiter.limit(ip || "anonymous");
    if (!ipRes.success) {
      return { success: false, limit: "ip" };
    }

    return { success: true };
  } catch (err) {
    console.error("Rate limiting check failed:", err);
    // Fail-open for rate limits if Redis throws an error
    return { success: true };
  }
}
