"use client";

export default function VideoCard({ video }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all text-left overflow-hidden max-w-md shadow-sm"
    >
      <div className="relative aspect-video w-20 shrink-0 rounded overflow-hidden bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col justify-center py-0.5">
        <h4 className="text-xs font-semibold text-zinc-800 line-clamp-1 leading-snug group-hover:text-zinc-950 transition-colors">
          {video.title}
        </h4>
        <span className="text-[10px] text-zinc-400 font-medium hover:underline mt-1 block">
          Watch
        </span>
      </div>
    </a>
  );
}
