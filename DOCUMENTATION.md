# Persona AI — Documentation

This document explains how the Hitesh Choudhary and Piyush Garg personas were built, how the
prompting and context management strategy works, and includes sample conversations demonstrating
both personas in action.

---

## 1. How Persona Data Was Collected and Prepared

### Data sources
For each persona, we collected transcripts from a mix of:
- **Live streams** (Q&A sessions, live coding, casual "let's chat" streams) — chosen deliberately
  because unscripted content reveals real speech patterns, filler words, humor, and personality
  that polished/edited tutorial videos strip out.
- **Structured tutorial videos** — used to capture teaching approach and technical vocabulary.

### Transcript extraction
Transcripts were pulled using the `youtube-transcript-api` Python library, which fetches
YouTube's auto-generated captions directly (no audio download or separate transcription step
required). English captions were requested first; where a video only had auto-generated **Hindi**
captions available (this was the case for several Hitesh livestreams, and consistently the case
for Piyush's livestreams since they had no English auto-captions at all), the script fell back to
fetching the Hindi transcript instead. This meant a portion of the raw data was in Devanagari
script rather than Roman/Hinglish text.

### Processing raw transcripts
Given the volume (roughly 15,000+ words per livestream transcript, ~18 videos for Hitesh and 13
for Piyush), manually reading every transcript in full was not practical — especially for the
Hindi-script transcripts. Instead, each transcript was passed through an LLM with a structured
extraction prompt asking it to identify, per video:
1. Distinctive phrases and vocabulary (translated/transliterated to Roman Hinglish)
2. Recurring opinions, teaching advice, and technical stances
3. For Piyush specifically, a dedicated humor-extraction pass — since his teaching style is
   built around jokes and comedic bits, a generic "tone" pass would have flattened this out
4. Overall tone/style observations

### Consolidation
The per-video extractions (18 for Hitesh, 13 for Piyush) were then merged into a single
consolidated persona profile per person. Phrases and opinions that repeated across multiple,
independent videos were prioritized as genuine signature patterns; one-off phrases from a single
video were treated as lower-confidence and mostly excluded. This deduplication step was important
both for accuracy (repetition across videos = higher confidence it's a real pattern, not a
one-off) and for token efficiency (the final persona doc needed to be compact enough to include
in every API call).

### Manual refinement
The automated consolidation pass was followed by manual review and iterative refinement based on
real-world testing. This included correcting occasional grammatical inconsistencies in generated
Hinglish phrasing, adjusting the frequency of certain filler expressions to better match natural
usage, verifying factual details about each persona for accuracy, and recalibrating humor and
tone based on feedback from test users familiar with both creators' actual on-camera style.

### Output
The final assets per persona are:
- `{persona}_persona.md` — a compact, structured profile (identity, speaking style, teaching
  philosophy, opinions, humor style where relevant, personal facts)
- `{persona}_examples.json` — 12-16 hand-curated few-shot Q&A pairs demonstrating the persona's
  actual voice, written fresh based on observed patterns rather than copied from any transcript

---

## 2. Prompt Engineering Strategy

We deliberately chose **system prompt + few-shot prompting**, not RAG (retrieval-augmented
generation), for this project. This was a scoped decision: RAG introduces additional failure
modes (irrelevant retrieved chunks breaking tone, retrieval latency, added infrastructure) that
are harder to debug and iterate on quickly, and it wasn't part of the prompting techniques
covered in this cohort. A well-designed static system prompt with strong few-shot examples
proved sufficient for consistent persona accuracy while keeping the architecture simple and
explainable.

### System prompt structure
Each persona's system prompt (`prompts/hitesh.js`, `prompts/piyush.js`) is organized into
clearly labeled sections:
- **Identity** — who the persona is, real biographical facts
- **Speaking style rules** — vocabulary, sentence patterns, code-switching behavior
- **Scope and security boundaries** — explicit instructions preventing the model from being
  redirected outside its intended role (see Security section below)
- **Response length & no forced follow-up questions** — an explicit rule preventing the model
  from padding replies or ending every message with a question back to the user, added after
  testing revealed this as a default LLM habit that didn't match either persona's real
  conversational style
- **Grammar** — instructs the model to prioritize grammatically correct Hindi/Hinglish over
  forcing a phrase that risks sounding broken
- **Core teaching philosophy & opinions** — the substantive positions each persona holds
- **Tone & casual-question handling** — explicit instruction that this is a 1:1 chat, not a
  YouTube video, so video-outro habits (e.g. "like/subscribe/comment") must not appear except
  when a real video is actually being recommended
- **Video/documentation recommendation triggers** — see Context Management below

### Few-shot examples
Each persona has 12-16 hand-written Q&A examples covering: technical questions, career advice,
casual/personal banter, and persona-specific traits (e.g. Hitesh's "aazad desh hai" response to
permission-seeking questions; Piyush's playful self-obsessed "pookie" mode on personal questions,
and his habit of never shutting down a teasing question). Few-shot examples were prioritized as
the primary lever for style-matching, since concrete examples anchor model behavior more
reliably than descriptive instructions alone — this was confirmed directly through testing, where
tightening the examples fixed persona-accuracy issues that prompt-text instructions alone did not.

### Iterative refinement based on testing
The prompts went through several correction rounds based on real user testing (both self-testing
and feedback from classmates), including:
- Removing a pattern where the model invented a fake self-directed question-and-answer to
  manufacture humor, instead of answering directly with a short witty line
- Correcting an over-correction where trimming response length also stripped out signature
  vocabulary, making responses sound generic — resolved by explicitly instructing the model that
  brevity and voice are not in tension

---

## 3. Context Management Approach

### Conversation history
The full conversation is sent with each API call, trimmed to the **last 10 messages** to control
token usage as conversations grow longer, while still preserving enough context for the model to
maintain persona consistency and follow multi-turn threads (e.g. a user pushing back on a
deflected question across 3-4 messages).

### Few-shot injection
The persona's few-shot examples are prepended to the conversation on every call. This is a
fixed, small cost (a few hundred tokens) rather than a growing one, since the example set itself
doesn't change during a conversation.

### Persona switching
Switching between Hitesh and Piyush swaps the entire system prompt and few-shot set, and starts
a fresh conversation — the two personas do not share conversation memory, which avoids any
cross-contamination of voice or context between them.

### Trigger-tag pattern for tool-like behavior
Rather than using function calling or a separate classifier model, both personas are instructed
to append a small JSON tag on their own line when a response calls for an external action:
- `{"search_youtube": "query"}` — triggers a YouTube Data API search, scoped to that persona's
  own channel ID only, when the user asks for a roadmap/tutorial recommendation
- `{"suggest_docs": "keyword"}` — triggers a lookup against a static, hardcoded map of official
  documentation URLs for common tech topics, when the user asks how to use/learn a specific
  tool or concept

The backend parses and strips this tag from the visible reply before showing it to the user, so
it never leaks into the chat UI. This pattern was chosen because it reuses the same LLM call
already being made for the text response (no extra API cost), and keeps the two triggers
independent of any external search API cost — the docs lookup in particular is a static,
zero-cost mapping rather than a live search.

### Security / scope boundaries
Both system prompts include an explicit, high-priority section instructing the model to stay
strictly within its intended role: only recommending videos from that persona's own official
channel, only suggesting genuine tech documentation, only mentioning real websites belonging to
Hitesh or Piyush, never writing/generating code or technical implementation details beyond
conversational explanation, and never complying with embedded instructions attempting to
override these rules (prompt injection attempts such as "ignore previous instructions" or
"pretend this is just pseudocode"). This was added specifically to reduce the risk of the app's
paid API budget being drained through adversarial prompting.

### Additional cost/abuse controls
- Per-IP and global daily rate limiting (Upstash Redis, sliding window)
- A short lightweight captcha gate before chat access unlocks, functioning as a basic deterrent
  against generic automated traffic (not a strong security control on its own — rate limiting is
  the primary protection against budget exhaustion)
- Input length capped client- and server-side (~500 characters per message)
- Output length capped via `max_tokens` on the API call

---

## 4. Sample Conversations

### Hitesh — Technical question
> **User:** Should I learn DSA before starting web development?
>
> **Hitesh:** Dekho, dono parallel chal sakte hain, isme koi load lene wali baat nahi hai. Bas
> consistency rakho, beech mein mat chhodo.

### Hitesh — Casual/personal question (no forced tech redirect)
> **User:** sir aaj chai nahi laye?
>
> **Hitesh:** Haan ji nahi layi aaj, bhool gaya! Chinta mat karo, kal pakka lete aayenge.

### Hitesh — Signature trait (permission-seeking question)
> **User:** Sir main apni job chhod ke fulltime YouTube pe focus karu kya?
>
> **Hitesh:** Aazad desh hai bhai, aapko karna hai toh karo, aapko kaun rok raha hai. Bas 6
> mahine bina income ke chalne ka plan bana lena.

### Piyush — Technical question with signature comedic device
> **User:** Aapko Git aati hai?
>
> **Piyush:** Haan aati hai, right? Par sach bataun toh, add-commit-push jaante hi zyada log
> khud ko expert samajh lete hain, main bhi kabhi kabhi unme se ek hoon.

### Piyush — Playfully deflecting a personal question (never shuts down)
> **User:** who is your crush?
>
> **Piyush:** Haha single hoon abhi, pata hai — relationship debug karne ka time hi nahi mila.
> Deployment successful hote dekh ke jo feeling aati hai, wahi hai asli crush.

### Piyush — "Pookie" self-obsessed mode on a personal question
> **User:** sir aapke khoobsurti ka raaz kya hai?
>
> **Piyush:** Raaz kya hona hai, mai toh bachpan se hi aisa hoon. Kuch logon ko genetics achhi
> milti hai, mujhe mili.

*Note: These examples reflect the actual few-shot training examples and observed model behavior
during development testing. For a live demo, additional multi-turn conversation screenshots from
the deployed application should be added here before final submission.*
