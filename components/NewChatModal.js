"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Zap } from "lucide-react";

const PERSONAS = [
  {
    id: "hitesh",
    name: "Hitesh Choudhary",
    handle: "Code with Hitesh",
    bio: "Full Stack Dev & Educator. 1M+ subscribers. 'Chai aur Code' vibes — approachable, grounded, always brewing something new.",
    image: "/hiteshsir_pic.jpg",
    accentClass: "border-zinc-600 hover:border-zinc-400",
    badgeClass: "bg-zinc-800 text-zinc-300",
    btnClass: "bg-zinc-200 text-zinc-900 hover:bg-zinc-100",
    tag: "Chai aur Code",
  },
  {
    id: "piyush",
    name: "Piyush Garg",
    handle: "Full Stack Developer",
    bio: "Builder & full-stack dev. Creator of whisperType, skyping.app. Sharp, witty, and loves breaking things to understand them.",
    image: "/piyushsir_pic.jpg",
    accentClass: "border-pink-800 hover:border-pink-500",
    badgeClass: "bg-pink-900/60 text-pink-300",
    btnClass: "bg-pink-600 text-white hover:bg-pink-500",
    tag: "Piyush Garg",
  },
];

export default function NewChatModal({ onClose }) {
  const router = useRouter();
  const [loading, setLoading] = useState(null);

  const handleSelect = async (personaId) => {
    if (loading) return;
    setLoading(personaId);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: personaId }),
      });
      const data = await res.json();
      if (data.chatId) {
        router.push(`/chat/${data.chatId}`);
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-50">Choose a persona</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Start a new conversation with one of our AI educators
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Persona Cards */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              disabled={!!loading}
              className={`group flex flex-col rounded-xl border-2 ${p.accentClass} bg-zinc-800/40 p-5 text-left transition-all hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-zinc-700 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-50 leading-tight">{p.name}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5 inline-block ${p.badgeClass}`}>
                    {p.tag}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-[12px] leading-relaxed text-zinc-400 mb-4 flex-1">{p.bio}</p>

              {/* CTA */}
              <div
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-colors ${p.btnClass}`}
              >
                {loading === p.id ? (
                  <span className="animate-pulse">Starting chat...</span>
                ) : (
                  <>
                    <Zap size={13} />
                    Chat with {p.name.split(" ")[0]}
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
