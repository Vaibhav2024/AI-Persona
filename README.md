# AI Persona Chat

An interactive Next.js web application that lets you chat with AI-powered personas of popular tech educators, Hitesh Choudhary and Piyush Garg. The AI models are fine-tuned via custom system prompts and few-shot examples to accurately mimic their teaching styles, humor, and technical philosophies.

## ✨ Features

- **Dual Personas:** Switch seamlessly between chatting with Hitesh Choudhary or Piyush Garg. Each persona has a distinctly crafted voice, tone, and set of boundaries.
- **YouTube Integration:** The AI can intelligently recommend relevant videos from their official YouTube channels directly in the chat when you ask for tutorials or roadmaps.
- **Sleek Dark Mode:** A modern, warm dark-mode interface built with Tailwind CSS, featuring custom color accents (like Piyush's signature pink theme).
- **Prompt Injection Hardened:** Built-in safeguards to prevent the AI from breaking character, writing raw code, or responding to jailbreak attempts.
- **Rate Limiting:** Protects the API endpoints from abuse using Upstash Redis sliding window rate limiting.
- **Markdown & Code Support:** The chat interface beautifully formats inline code, bold text, and multi-line code blocks.

## 🚀 Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **AI/LLM:** OpenAI API
- **External APIs:** YouTube Data API v3
- **Rate Limiting:** Upstash Redis
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

Create a `.env` file in the root directory and add your API keys:

```env
# OpenAI API Key for generating chat responses
OPENAI_API_KEY=your_openai_api_key_here

# YouTube Data API Key for fetching video recommendations
YOUTUBE_API_KEY=your_youtube_api_key_here

# Upstash Redis for API rate limiting
UPSTASH_REDIS_REST_URL=your_upstash_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application running.

## 📂 Project Structure

- `/app`: Next.js App Router pages and API routes (e.g., `/api/chat`).
- `/components`: Reusable React components (`ChatWindow`, `MessageBubble`, `PersonaSwitcher`).
- `/lib`: Helper functions for OpenAI integration, YouTube API calls, and Rate Limiting.
- `/prompts`: Core system prompts and behavior guidelines for the personas (`hitesh.js`, `piyush.js`).
