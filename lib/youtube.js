// lib/youtube.js

const CHANNEL_IDS = {
  hitesh: [process.env.HITESH_CHANNEL_ID, process.env.HITESH_CHANNEL_ID2].filter(Boolean),
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
    // Flatten and limit to top 3 videos overall
    return allResults.flat().slice(0, 3);
  } catch (err) {
    console.error("YouTube search failed:", err);
    return [];
  }
}
