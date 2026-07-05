import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function askOpenAI({ systemPrompt, messages }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is missing.");
  }

  const input = messages.map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content,
  }));

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      instructions: systemPrompt,
      input,
      max_output_tokens: 450,
      temperature: 0.8,
    });

    console.log("=== OpenAI Stats ===", response.usage);

    return response.output_text || "";
  } catch (err) {
    console.error("OpenAI API call failed:", err.status, err.message);
    throw new Error(`OpenAI API returned status ${err.status}: ${err.message}`);
  }
}
