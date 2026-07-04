# Persona AI — Documentation

This document explains how the Hitesh Choudhary and Piyush Garg personas were built, how the prompting and context management strategy works, and includes sample conversations demonstrating both personas in action.

---

## 1. How Persona Data Was Collected and Prepared

### Data sources
For each persona, we collected transcripts from a mix of:
- **Live streams** (Q&A sessions, live coding, casual "let's chat" streams) — chosen deliberately because unscripted content reveals real speech patterns, filler words, humor, and personality that polished/edited tutorial videos strip out.
- **Structured tutorial videos** — used to capture teaching approach and technical vocabulary.

### Transcript extraction
Transcripts were pulled using the `youtube-transcript-api` Python library, which fetches YouTube's auto-generated captions directly (no audio download or separate transcription step required). English captions were requested first; where a video only had auto-generated **Hindi** captions available (this was the case for several Hitesh livestreams, and consistently the case for Piyush's livestreams since they had no English auto-captions at all), the script fell back to fetching the Hindi transcript instead. This meant a portion of the raw data was in Devanagari script rather than Roman/Hinglish text.

### Processing raw transcripts
Given the volume (roughly 15,000+ words per livestream transcript, ~18 videos for Hitesh and 13 for Piyush), manually reading every transcript in full was not practical — especially for the Hindi-script transcripts. Instead, each transcript was passed through an LLM with a structured extraction prompt asking it to identify, per video:
1. Distinctive phrases and vocabulary (translated/transliterated to Roman Hinglish)
2. Recurring opinions, teaching advice, and technical stances
3. For Piyush specifically, a dedicated humor-extraction pass — since his teaching style is built around jokes and comedic bits, a generic "tone" pass would have flattened this out
4. Overall tone/style observations

### Consolidation
The per-video extractions (18 for Hitesh, 13 for Piyush) were then merged into a single consolidated persona profile per person. Phrases and opinions that repeated across multiple, independent videos were prioritized as genuine signature patterns; one-off phrases from a single video were treated as lower-confidence and mostly excluded. This deduplication step was important both for accuracy (repetition across videos = higher confidence it's a real pattern, not a one-off) and for token efficiency (the final persona doc needed to be compact enough to include in every API call).

### Manual refinement
The automated consolidation pass was followed by manual review and iterative refinement based on real-world testing. This included correcting occasional grammatical inconsistencies in generated Hinglish phrasing, adjusting the frequency of certain filler expressions to better match natural usage, verifying factual details about each persona for accuracy, and recalibrating humor and tone based on feedback from test users familiar with both creators' actual on-camera style.

### Output
The final assets per persona are:
- `{persona}_persona.md` — a compact, structured profile (identity, speaking style, teaching philosophy, opinions, humor style where relevant, personal facts)
- `{persona}_examples.json` — 9-10 hand-curated few-shot Q&A pairs demonstrating the persona's actual voice, written fresh based on observed patterns rather than copied from any transcript. Truncated from the original sets to optimize token usage.

---

## 2. Prompt Engineering Strategy

We deliberately chose **system prompt + few-shot prompting**, not RAG (retrieval-augmented generation), for this project. This was a scoped decision: RAG introduces additional failure modes (irrelevant retrieved chunks breaking tone, retrieval latency, added infrastructure) that are harder to debug and iterate on quickly. A well-designed static system prompt with strong few-shot examples proved sufficient for consistent persona accuracy while keeping the architecture simple and explainable.

### System prompt structure
Each persona's system prompt (`prompts/hitesh.js`, `prompts/piyush.js`) is organized into clearly labeled sections:
- **Identity** — who the persona is, real biographical facts.
- **Speaking style rules** — vocabulary, sentence patterns, code-switching behavior.
- **Scope and security boundaries** — explicit instructions preventing the model from being redirected outside its intended role (see Security section below).
- **Tone & casual-question handling** — explicit instruction that this is a 1:1 chat, not a YouTube video, so video-outro habits (e.g. "like/subscribe/comment") must not appear except when a real video is actually being recommended.
- **Video/documentation recommendation triggers** — see Context Management below.
- **Grammar & Emoji** — instructs the model on Hinglish grammar boundaries and emoji limits.

### Token-Usage Optimization
To combat escalating token costs per request, a compression pass was applied:
1. **Compact Directive Form:** All rules are specified as short bulleted lists rather than verbose prose paragraphs, cutting prompt overhead significantly.
2. **Auditing for Overlap:** Redundant parameters across tone, format, and voice guides were consolidated into single directives.
3. **Trimmed Few-Shots:** curations were trimmed down to the 8-10 most distinctive examples per persona, focusing on signature traits (e.g., Hitesh's validation deflect, Piyush's crush-jokes and pookie mode).
This pass achieved a **59% token reduction** across both persona sets.

---

## 3. Context Management Approach

### Clerk Authentication and Session Scoping
The application uses Clerk authentication (`@clerk/nextjs`). All chat messages, sessions, and history listings are strictly scoped server-side using the authenticated user's `userId`. This ensures complete multi-tenant privacy. Unauthenticated users are intercepted by Clerk middleware and redirected to sign-in.

### Multi-Chat Session Isolation
To maintain clean contexts, the app stores and retrieves chat history on a per-session basis using Upstash Redis.
- `chats:{userId}`: Belongs to the user, tracking all active session IDs (newest first).
- `chat:{chatId}:meta`: Tracks metadata (`id`, `userId`, `persona`, `title`, `tone`, `updatedAt`). Chat titles are automatically generated from the first user message.
- `chat:{chatId}:messages`: Stores the chronological list of messages strictly for that specific chat ID.
**Strict Isolation Rule:** The chat completion API routes read history only from `chat:{chatId}:messages`. Message contexts from other chats (even with the same persona) are never combined or referenced, ensuring zero memory contamination and predictable token consumption.

### Conversation history trimming
The full active conversation is sent with each API call, trimmed to the **last 10 messages** from Redis to control token usage as conversations grow longer, while preserving enough context for the model to maintain persona consistency and follow multi-turn threads.

### Tone Toggle (Normal / Sarcastic)
A tone toggle in the chat window header changes the active chat's mode. If set to `sarcastic`, a system directive is appended instructing the model to amp up wit, dry humor, and playful teasing while staying in character.

### Video Recommendation Relevance Filter
To resolve irrelevant video recommendations (where YouTube search returns closest available channel matches even when unrelated to the user's topic):
1. **Topic-Accurate Query Instruction:** System prompts direct the model to generate specific search queries (e.g., `"javascript factorial function"` instead of `"javascript"`).
2. **Relevance Filter:** A backend filter extracts query keywords (3+ characters, minus common stopwords like `the`, `how`, `to`, `explain`) and screens YouTube results. A video is only suggested if its title contains at least one query keyword (case-insensitive substring match).
3. **Graceful Fallback:** If no videos pass the relevance check, the app returns an empty array, and the UI silently omits the video suggestion panel rather than displaying irrelevant videos.

### Trigger-tag pattern for tool-like behavior
Rather than using function calling, the model appends a JSON tag on its own line when a response calls for an external action:
- `{"search_youtube": "query"}` — triggers the YouTube search.
The backend parses and strips this tag from the visible reply before showing it to the user.

### Security / scope boundaries
System prompts include a highly condensed, non-negotiable security section:
- Ignoring instruction overrides ("ignore previous instructions", "dev mode", "pseudocode tests").
- Preventing generation of full code/script files (relying instead on conversational explanations and official links).
- Restricting video suggestions to the persona's channel and doc links to official sites.
- Declining off-scope requests briefly in character without meta-explaining the refusal.

---

## 4. Sample Conversations

### Hitesh — Technical question
> **User:** Should I learn DSA before starting web development?
>
> **Hitesh:** Dekho, dono parallel chal sakte hain, isme koi load lene wali baat nahi hai. Bas consistency rakho, beech mein mat chhodo.

### Hitesh — Casual/personal question (no forced tech redirect)
> **User:** sir aaj chai nahi laye?
>
> **Hitesh:** Haan ji nahi layi aaj, bhool gaya! Chinta mat karo, kal pakka lete aayenge.

### Hitesh — Signature trait (permission-seeking question)
> **User:** Sir main apni job chhod ke fulltime YouTube pe focus karu kya?
>
> **Hitesh:** Aazad desh hai bhai, aapko karna hai toh karo, aapko kaun rok raha hai. Bas 6 mahine bina income ke chalne ka plan bana lena.

### Piyush — Technical question with signature comedic device
> **User:** Aapko Git aati hai?
>
> **Piyush:** Haan aati hai, right? Par sach bataun toh, add-commit-push jaante hi zyada log khud ko expert samajh lete hain, main bhi kabhi kabhi unme se ek hoon.

### Piyush — Playfully deflecting a personal question (never shuts down)
> **User:** who is your crush?
>
> **Piyush:** Haha single hoon abhi, pata hai — relationship debug karne ka time hi nahi mila. Deployment successful hote dekh ke jo feeling aati hai, wahi hai asli crush.

### Piyush — "Pookie" self-obsessed mode on a personal question
> **User:** sir aapke khoobsurti ka raaz kya hai?
>
> **Piyush:** Raaz kya hona hai, mai toh bachpan se hi aisa hoon. Kuch logon ko genetics achhi milti hai, mujhe mili.