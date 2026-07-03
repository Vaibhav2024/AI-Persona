"use client";

import { useState } from "react";
import PersonaSwitcher from "@/components/PersonaSwitcher";
import ChatWindow from "@/components/ChatWindow";
import { welcomeMessages } from "@/lib/personaUiText";

const PERSONA_DETAILS = {
  hitesh: {
    handle: "Code with Hitesh",
    bio: "Full Stack Developer & Educator. 1M+ subscribers teaching web dev.",
    image: "/hiteshsir_pic.jpg",
  },
  piyush: {
    handle: "Full Stack Developer",
    bio: "Full Stack Developer & product builder. whisperType, skyping.app creator.",
    image: "/piyushsir_pic.jpg",
  },
};

export default function Home() {
  const [persona, setPersona] = useState("hitesh");
  const [hiteshMessages, setHiteshMessages] = useState([
    { role: "assistant", content: welcomeMessages.hitesh, isWelcome: true },
  ]);
  const [piyushMessages, setPiyushMessages] = useState([
    { role: "assistant", content: welcomeMessages.piyush, isWelcome: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentMessages = persona === "hitesh" ? hiteshMessages : piyushMessages;
  const activeDetails = PERSONA_DETAILS[persona];

  const handleSendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: "user", content: text };
    let updatedHistory = [...currentMessages, userMessage];

    if (persona === "hitesh") {
      setHiteshMessages(updatedHistory);
    } else {
      setPiyushMessages(updatedHistory);
    }

    setLoading(true);
    setError("");

    try {
      const apiMessages = updatedHistory.filter((msg) => !msg.isWelcome);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona,
          messages: apiMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI reply.");
      }

      const assistantMessage = {
        role: "assistant",
        content: data.reply,
        videos: data.videos || [],
      };

      if (persona === "hitesh") {
        setHiteshMessages((prev) => [...prev, assistantMessage]);
      } else {
        setPiyushMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaChange = (selectedPersona) => {
    setPersona(selectedPersona);
    setError("");
    if (selectedPersona === "hitesh") {
      setHiteshMessages([
        { role: "assistant", content: welcomeMessages.hitesh, isWelcome: true },
      ]);
    } else {
      setPiyushMessages([
        { role: "assistant", content: welcomeMessages.piyush, isWelcome: true },
      ]);
    }
  };

  return (
    <main className="h-screen w-screen bg-zinc-950 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden">
      <div className="w-full max-w-5xl h-full max-h-[92vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-lg">
        {/* Header Bar */}
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900 shrink-0">
          <h1 className="text-base font-bold text-zinc-50 tracking-tight">
            Persona AI Chat
          </h1>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-red-950 p-2.5 text-xs text-red-400 border border-red-900 shrink-0">
            {error}
          </div>
        )}

        {/* Dashboard Panels */}
        <div className="flex-1 flex min-h-0 w-full">
          {/* Left Sidebar */}
          <aside className="w-72 border-r border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-5 shrink-0 select-none">
            {/* Tabs Selector */}
            <div>
              <PersonaSwitcher activePersona={persona} onSwitch={handlePersonaChange} />
            </div>

            {/* Active YouTuber Bio Card */}
            <div className="rounded-[18px] border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-3 shadow-sm mt-1">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 select-none overflow-hidden rounded-full border border-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeDetails.image}
                    alt={persona === "hitesh" ? "Hitesh Choudhary" : "Piyush Garg"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-50 leading-tight">
                    {persona === "hitesh" ? "Hitesh Choudhary" : "Piyush Garg"}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                    {activeDetails.handle}
                  </p>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400 mt-1">
                {activeDetails.bio}
              </p>
            </div>
          </aside>

          {/* Right Chat Pane Container */}
          <section className="flex-1 p-5 bg-zinc-950/50 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <ChatWindow
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                loading={loading}
                persona={persona}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
