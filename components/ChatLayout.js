"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import NewChatModal from "./NewChatModal";
import { MessageSquare, Menu, X } from "lucide-react";

export default function ChatLayout({
  chats,
  activeChatId,
  chatMeta,
  initialMessages,
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(!activeChatId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatList, setChatList] = useState(chats);

  // Sync state with server-side chats prop when it changes (e.g. after deletion/navigation)
  useEffect(() => {
    setChatList(chats);
  }, [chats]);

  // Refresh sidebar chat list whenever a message is successfully sent
  // This is how sidebar titles update after the first message sets the title
  const refreshChats = async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      if (data.chats) setChatList(data.chats);
    } catch {
      // silent
    }
  };

  const handleNewChat = () => {
    setShowModal(true);
    setSidebarOpen(false);
  };

  return (
    <main className="h-screen w-screen bg-zinc-950 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar
          chats={chatList}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm font-bold text-zinc-50">Persona AI</span>
          <div className="w-8" />
        </div>

        {/* Chat area */}
        <div className="flex-1 min-h-0 p-3 sm:p-4 md:p-5">
          {activeChatId && chatMeta ? (
            <ChatWindow
              chatId={activeChatId}
              persona={chatMeta.persona}
              initialMessages={initialMessages}
              tone={chatMeta.tone || "normal"}
              onMessageSent={refreshChats}
            />
          ) : (
            // Empty state when no chat is active
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <div className="h-14 w-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <MessageSquare size={24} className="text-zinc-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-200">
                  Start a new conversation
                </h2>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                  Click &quot;New chat&quot; and choose a persona to begin
                </p>
              </div>
              <button
                onClick={handleNewChat}
                className="mt-2 rounded-xl bg-zinc-800 border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600 transition-all"
              >
                + New chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showModal && (
        <NewChatModal
          onClose={() => {
            setShowModal(false);
            // If user dismisses and there's no active chat, stay on /chat
            if (!activeChatId) {
              router.push("/chat");
            }
          }}
        />
      )}
    </main>
  );
}
