// lib/openai.js

/**
 * Sends a conversation history to OpenAI Chat Completions API.
 * @param {Object} params
 * @param {string} params.systemPrompt
 * @param {Array<{role: string, content: string}>} params.messages
 * @returns {Promise<string>} LLM response text
 */
export async function askOpenAI({ systemPrompt, messages }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is missing.");
  }

  // Format messages for OpenAI: prepend system prompt as first message
  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      max_tokens: 450,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("OpenAI API call failed:", res.status, errorText);
    throw new Error(`OpenAI API returned status ${res.status}: ${errorText}`);
  }

  const data = await res.json();

  console.log("=== OpenAI Stats ===", data.usage);

  return data.choices?.[0]?.message?.content || "";
}
