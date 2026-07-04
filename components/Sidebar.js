"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  PlusCircle,
  Search,
  MessageSquare,
  Clock,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const PERSONA_LABELS = {
  hitesh: { label: "Hitesh Choudhary", color: "bg-zinc-700 text-zinc-300" },
  piyush: { label: "Piyush Garg", color: "bg-pink-900/60 text-pink-300" },
};

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function Sidebar({ chats, activeChatId, onNewChat }) {
  const router = useRouter();
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [chats, search]);

  const handleChatClick = (chatId) => {
    router.push(`/chat/${chatId}`);
  };

  // Step 1: clicking trash icon opens the confirmation popup
  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();
    setConfirmDeleteId(chatId);
  };

  // Step 2a: user cancelled
  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  // Step 2b: user confirmed — actually delete
  const handleConfirmDelete = async () => {
    const chatId = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(chatId);
    try {
      await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (activeChatId === chatId) {
        router.push("/chat");
      } else {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  // Title of the chat being confirmed for display in the modal
  const confirmChat = chats.find((c) => c.id === confirmDeleteId);

  return (
    <aside className="w-72 shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800 h-full select-none">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-zinc-200 to-zinc-400 flex items-center justify-center shrink-0">
            <MessageSquare size={15} className="text-zinc-900" />
          </div>
          <span className="text-sm font-bold text-zinc-50 tracking-tight">
            Persona AI
          </span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2.5 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600 transition-all group"
        >
          <PlusCircle
            size={16}
            className="text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0"
          />
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <MessageSquare size={22} className="text-zinc-700" />
            <p className="text-xs text-zinc-500">
              {search ? "No chats match your search" : "No chats yet"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 px-1 mt-1">
              History
            </p>
            <ul className="space-y-0.5">
              {filtered.map((chat) => {
                const isActive = chat.id === activeChatId;
                const persona = PERSONA_LABELS[chat.persona] || {
                  label: chat.persona,
                  color: "bg-zinc-700 text-zinc-300",
                };
                return (
                  <li key={chat.id}>
                    <div
                      onClick={() => handleChatClick(chat.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleChatClick(chat.id)}
                      className={`group w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-zinc-800 border border-zinc-700"
                          : "border border-transparent hover:bg-zinc-800/50 hover:border-zinc-800"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[13px] font-medium truncate leading-snug ${
                            isActive ? "text-zinc-100" : "text-zinc-300"
                          }`}
                        >
                          {chat.title || "New chat"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${persona.color}`}
                          >
                            {persona.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                          <Clock size={9} />
                          {relativeTime(chat.updatedAt)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteClick(e, chat.id)}
                          disabled={deletingId === chat.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-zinc-600 hover:text-red-400 disabled:opacity-30"
                          title="Delete chat"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="border-t border-zinc-800 px-4 py-3 shrink-0 flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
              userButtonPopoverCard: "bg-zinc-900 border border-zinc-800",
              userButtonPopoverActionButton: "text-zinc-300 hover:bg-zinc-800",
              userButtonPopoverActionButtonText: "text-zinc-300",
              userButtonPopoverFooter: "hidden",
            },
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-200 truncate">
            {user?.firstName
              ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
              : user?.emailAddresses?.[0]?.emailAddress || "Account"}
          </p>
          <p className="text-[10px] text-zinc-500 truncate">
            {user?.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>
        <ChevronRight size={13} className="text-zinc-600 shrink-0" />
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleCancelDelete}
        >
          <div
            className="w-full max-w-xs bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4">
              <div className="h-9 w-9 rounded-xl bg-red-950 border border-red-900 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-50">Delete chat?</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Chat title preview */}
            {confirmChat?.title && (
              <div className="mx-5 mb-4 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2">
                <p className="text-xs text-zinc-300 truncate">
                  &quot;{confirmChat.title}&quot;
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2.5 px-5 pb-5">
              <button
                onClick={handleCancelDelete}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
