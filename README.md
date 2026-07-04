# AI Persona Chat

An interactive Next.js web application that lets you chat with AI-powered personas of popular tech educators, Hitesh Choudhary and Piyush Garg. The AI models are fine-tuned via custom system prompts and few-shot examples to accurately mimic their teaching styles, humor, and technical philosophies.

Now featuring Clerk authentication, multi-chat session history stored in Upstash Redis, a "Normal / Sarcastic" tone toggle, and optimized token usage.

## ✨ Features

- **Authentication (Clerk):** Secure login and registration. Chat sessions and history are scoped server-side to the authenticated user's ID.
- **Multi-Chat Session History:** Create, list, delete, and switch between multiple isolated chat sessions. Stored persistently in Upstash Redis, grouped by persona in a left sidebar.
- **Auto-Generated Titles:** Chat session titles are automatically set and updated based on the user's first message in that session.
- **Tone Toggle (Normal / Sarcastic):** Switch tones in the chat header to change the persona's response style. Sarcastic mode amps up wit, dry humor, and playful teasing.
- **Dual Personas:** Switch seamlessly between chatting with Hitesh Choudhary or Piyush Garg. Each persona has a distinctly crafted voice, tone, and set of boundaries.
- **Relevance-Filtered YouTube Integration:** The AI recommends relevant videos from their official YouTube channels. A post-fetch relevance filter extracts keywords from the query and drops irrelevant suggestions, showing them only when they match the topic.
- **Sleek Dark Mode:** A modern, warm dark-mode interface built with Tailwind CSS, featuring custom color accents (like Piyush's signature pink theme).
- **Prompt Injection Hardened:** Built-in safeguards to prevent the AI from breaking character, writing raw code, or responding to jailbreak attempts.
- **Rate Limiting:** Protects the API endpoints from abuse using Upstash Redis sliding window rate limiting.
- **Markdown & Code Support:** The chat interface beautifully formats inline code, bold text, and multi-line code blocks.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Authentication:** Clerk (@clerk/nextjs v5)
- **Database/Storage:** Upstash Redis (chat sessions, message logs, and rate limits)
- **Styling:** Tailwind CSS
- **AI/LLM:** OpenAI API
- **External APIs:** YouTube Data API v3
- **Icons:** Lucide React

## 🛠️ Setup and Installation

### 1. Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- npm or yarn

### 2. Clone the Repository

```bash
git clone https://github.com/Vaibhav2024/AI-Persona.git
cd ai-persona
```

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. Environment Variables

Create a `.env.local` file in the root directory and add your API keys:

```env
# OpenAI API Key for generating chat responses
OPENAI_API_KEY=your_openai_api_key_here

# Clerk Authentication (get keys from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# YouTube Data API Key for fetching video recommendations
YOUTUBE_API_KEY=your_youtube_api_key_here
HITESH_CHANNEL_ID=UCNQ6FEtztATuaVhZKCY28Yw
HITESH_CHANNEL_ID2=UCXgGY0wkgOzynnHvSEVmE3A
PIYUSH_CHANNEL_ID=UCf9T51_FmMlfhiGpoes0yFA

# Upstash Redis for API rate limiting and chat history
UPSTASH_REDIS_REST_URL=your_upstash_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here

# Captcha JWT Secret
JWT_SECRET=your-super-secret-jwt-key
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application running.

## 📂 Project Structure

- `/app`: Next.js App Router pages and API routes (e.g., `/api/chat`, `/api/chats`).
- `/components`: Reusable React components (`Sidebar`, `ChatWindow`, `MessageBubble`, `NewChatModal`, `ChatLayout`).
- `/lib`: Helper functions for Redis data access (`chatStore.js`, `redis.js`), OpenAI, YouTube, and Rate Limiting.
- `/prompts`: Core system prompts and behavior guidelines for the personas (`hitesh.js`, `piyush.js`).
