"use client";

import { useState, useEffect } from "react";
import VideoCard from "./VideoCard";

export default function MessageBubble({ message, persona }) {
  const isUser = message.role === "user";
  const isWelcome = message.isWelcome === true;
  const [displayedContent, setDisplayedContent] = useState(isWelcome ? "" : message.content);

  useEffect(() => {
    if (!isWelcome) {
      setDisplayedContent(message.content);
      return;
    }

    setDisplayedContent("");
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < message.content.length) {
        setDisplayedContent(message.content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 20); // 20ms per character typing speed

    return () => clearInterval(interval);
  }, [message.content, isWelcome]);

  // Simple parser to format markdown-like syntax: bold, code blocks, inline code, and line breaks
  const formatContent = (text) => {
    if (!text) return "";

    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Code Block
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeLines = part.slice(3, -3).trim().split("\n");
        let language = "";
        let code = part.slice(3, -3).trim();
        if (codeLines[0] && !codeLines[0].includes(" ") && codeLines[0].length < 15) {
          language = codeLines[0];
          code = codeLines.slice(1).join("\n");
        }

        return (
          <div key={index} className="my-2 rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden font-mono text-[13px] text-zinc-200">
            {language && (
              <div className="bg-zinc-900 border-b border-zinc-700 px-3 py-1.5 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                {language}
              </div>
            )}
            <pre className="p-3 overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Inline formatting (bold, inline code, paragraphs)
      const subParts = part.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
      return (
        <span key={index}>
          {subParts.map((subPart, subIndex) => {
            if (subPart.startsWith("**") && subPart.endsWith("**")) {
              return (
                <strong key={subIndex} className="font-bold text-zinc-50">
                  {subPart.slice(2, -2)}
                </strong>
              );
            }
            if (subPart.startsWith("`") && subPart.endsWith("`")) {
              return (
                <code key={subIndex} className="rounded bg-zinc-700/60 border border-zinc-600 px-1 py-0.5 text-xs font-mono text-zinc-200 font-bold">
                  {subPart.slice(1, -1)}
                </code>
              );
            }
            if (subPart === "\n") {
              return <br key={subIndex} />;
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`flex gap-3 max-w-3xl w-fit ${isUser ? "ml-auto" : "mr-auto"}`}>
      {/* Assistant Avatar Photo */}
      {!isUser && (
        <div className="h-9 w-9 shrink-0 select-none overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
          <img
            src={persona === "hitesh" ? "/hiteshsir_pic.jpg" : "/piyushsir_pic.jpg"}
            alt={persona === "hitesh" ? "Hitesh Choudhary" : "Piyush Garg"}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Bubble Content */}
      <div className="flex flex-col gap-2">
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
            isUser
              ? persona === "piyush"
                ? "rounded-tr-none bg-pink-600 text-white font-medium"
                : "rounded-tr-none bg-zinc-200 text-zinc-900 font-medium"
              : "rounded-tl-none bg-zinc-800 text-zinc-200"
          }`}
        >
          {formatContent(displayedContent)}
        </div>

        {/* Suggested YouTube Videos */}
        {message.videos && message.videos.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pl-1">
              Suggested Videos:
            </div>
            <div className="grid grid-cols-1 gap-2">
              {message.videos.map((vid, idx) => (
                <VideoCard key={vid.videoId || idx} video={vid} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
