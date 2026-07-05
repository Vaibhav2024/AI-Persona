// lib/youtube.js

const CHANNEL_IDS = {
  hitesh: [
    process.env.HITESH_CHANNEL_ID,
    process.env.HITESH_CHANNEL_ID_2 || process.env.HITESH_CHANNEL_ID2
  ].filter(Boolean),
  piyush: [process.env.PIYUSH_CHANNEL_ID].filter(Boolean),
};

export async function searchPersonaVideos(query, persona) {
  const channels = CHANNEL_IDS[persona] || [];
  if (channels.length === 0) return [];

  const fetchForChannel = async (channelId) => {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      channelId: channelId,
      type: "video",
      maxResults: "3",
      order: "relevance",
      key: process.env.YOUTUBE_API_KEY,
    });

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!res.ok) {
        console.error("YouTube API error:", res.status, await res.text());
        return [];
      }
      const data = await res.json();

      return (data.items || []).map((item) => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        thumbnail: item.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
    } catch (err) {
      console.error(`YouTube search failed for channel ${channelId}:`, err);
      return [];
    }
  };

  try {
    const allResults = await Promise.all(channels.map(fetchForChannel));
    const flatResults = allResults.flat();

    // Deduplicate by videoId
    const seen = new Set();
    const uniqueResults = flatResults.filter((video) => {
      if (!video.videoId || seen.has(video.videoId)) return false;
      seen.add(video.videoId);
      return true;
    });

    // Stopwords list to filter out common search words
    const STOPWORDS = new Set([
      "the", "how", "to", "a", "an", "and", "or", "for", "with", "about",
      "what", "why", "is", "are", "was", "were", "be", "been", "being",
      "video", "explain", "explaining", "tutorial", "course", "playlist",
      "learn", "learning", "code", "coding", "programming", "developer",
      "development", "in", "of", "on", "at", "by", "from", "up", "into",
      "over", "after", "should", "i", "do", "you", "me", "my", "your", "we", "us",
      "sikhni", "learn", "sikhao", "sikha", "seekh", "seekho", "sikhna", "seekhna",
      "basics", "basic", "introduction", "intro", "crash", "complete", "guide",
      "beginner", "beginners", "hindi", "english", "shot", "one", "full", "detailed",
      "sir", "bhai", "yaar"
    ]);

    // Extract meaningful keywords (3+ chars, lowercase, not a stopword)
    const keywords = query
      .toLowerCase()
      .split(/[\s\-_,.]+/)
      .map(w => w.replace(/[^a-z0-9]/g, ""))
      .filter(w => w.length >= 3 && !STOPWORDS.has(w));

    if (keywords.length === 0) {
      return [];
    }

    // Generic languages, frameworks, and platform names
    const GENERIC_TECH = new Set([
      "javascript", "js", "typescript", "ts", "python", "py", "java", "golang", "go",
      "react", "reactjs", "nextjs", "next", "node", "nodejs", "express", "html", "css",
      "web", "dev", "development", "programming", "coding"
    ]);

    // Core topic keywords are those that are NOT generic tech names
    const coreKeywords = keywords.filter(w => !GENERIC_TECH.has(w));
    const queryTechKeywords = keywords.filter(w => GENERIC_TECH.has(w));

    // Filter results based on relevance
    const relevantResults = uniqueResults.filter((video) => {
      const titleLower = (video.title || "").toLowerCase();

      // 1. Tech matching rule with word boundaries
      if (queryTechKeywords.length > 0) {
        const matchesTech = queryTechKeywords.some(k => {
          if (k === "typescript" || k === "ts") {
            return /\b(?:typescript|ts)\b/i.test(titleLower);
          }
          if (k === "javascript" || k === "js") {
            return /\b(?:javascript|js)\b/i.test(titleLower);
          }
          if (k === "nextjs" || k === "next") {
            return /\b(?:nextjs|next)\b/i.test(titleLower);
          }
          if (k === "nodejs" || k === "node") {
            return /\b(?:nodejs|node)\b/i.test(titleLower);
          }
          if (k === "go" || k === "golang") {
            return /\b(?:go|golang)\b/i.test(titleLower);
          }
          if (k === "py" || k === "python") {
            return /\b(?:py|python)\b/i.test(titleLower);
          }
          return new RegExp(`\\b${k}\\b`, "i").test(titleLower);
        });
        if (!matchesTech) return false;
      }

      // 2. Core keyword matching rule
      if (coreKeywords.length > 0) {
        return coreKeywords.some(k => new RegExp(`\\b${k}\\b`, "i").test(titleLower));
      }

      return true;
    });

    return relevantResults.slice(0, 3);
  } catch (err) {
    console.error("YouTube search failed:", err);
    return [];
  }
}
