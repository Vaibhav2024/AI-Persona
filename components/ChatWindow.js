"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { thinkingMessages, welcomeMessages } from "@/lib/personaUiText";

export default function ChatWindow({
  chatId,
  persona,
  initialMessages,
  tone: initialTone,
  onMessageSent,
}) {
  const [messages, setMessages] = useState(() => {
    // Seed with stored messages, or the welcome message if the chat is empty
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [
      {
        role: "assistant",
        content: welcomeMessages[persona] || "Hello! How can I help you?",
        isWelcome: true,
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tone, setTone] = useState(initialTone || "normal");
  const [thinkingMsg, setThinkingMsg] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setThinkingMsg("");
      return;
    }
    const list = thinkingMessages[persona] || [];
    if (list.length === 0) return;
    setThinkingMsg(list[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % list.length;
      setThinkingMsg(list[index]);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading, persona]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput("");
    setError("");

    // Optimistically render the user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, userMessage: text, tone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI reply.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          videos: data.videos || [],
        },
      ]);
      // Notify parent so the sidebar title refreshes (critical after first message)
      onMessageSent?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const getPersonaDisplayName = () =>
    persona === "hitesh" ? "Hitesh Choudhary" : "Piyush Garg";

  const isSarcastic = tone === "sarcastic";

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
      {/* Chat Window Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={persona === "hitesh" ? "/hiteshsir_pic.jpg" : "/piyushsir_pic.jpg"}
              alt={getPersonaDisplayName()}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-50 leading-tight">
              {getPersonaDisplayName()}
            </h2>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Tone Toggle */}
        <button
          onClick={() => setTone((t) => (t === "normal" ? "sarcastic" : "normal"))}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
            isSarcastic
              ? persona === "piyush"
                ? "bg-pink-900/40 border-pink-700 text-pink-300"
                : "bg-amber-900/30 border-amber-700 text-amber-300"
              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
          }`}
          title="Toggle between Normal and Sarcastic tone"
        >
          {isSarcastic ? (
            <ToggleRight size={14} />
          ) : (
            <ToggleLeft size={14} />
          )}
          {isSarcastic ? "Sarcastic" : "Normal"}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-3 rounded-lg bg-red-950 p-2.5 text-xs text-red-400 border border-red-900 shrink-0">
          {error}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">No messages yet</p>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                Ask a roadmap query or any programming questions!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} persona={persona} />
          ))
        )}

        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-pulse">
            <div className="h-9 w-9 shrink-0 select-none overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={persona === "hitesh" ? "/hiteshsir_pic.jpg" : "/piyushsir_pic.jpg"}
                alt={getPersonaDisplayName()}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mt-1">
                {thinkingMsg}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-zinc-800 bg-zinc-900 p-4 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${persona === "hitesh" ? "Hitesh" : "Piyush"} anything...`}
            maxLength={500}
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors disabled:opacity-50"
          />
          <div className="text-xs text-zinc-500 font-medium whitespace-nowrap min-w-[50px] text-right">
            {input.length} / 500
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              persona === "piyush"
                ? "bg-pink-600 text-white hover:bg-pink-700"
                : "bg-zinc-200 text-zinc-900 hover:bg-zinc-300"
            }`}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
