"use client";

export default function PersonaSwitcher({ activePersona, onSwitch }) {
  const personas = [
    { id: "hitesh", name: "Hitesh Choudhary" },
    { id: "piyush", name: "Piyush Garg" },
  ];

  return (
    <div className="flex gap-1 bg-zinc-800 p-1 rounded-lg w-full">
      {personas.map((persona) => {
        const isActive = activePersona === persona.id;
        return (
          <button
            key={persona.id}
            onClick={() => onSwitch(persona.id)}
            className={`flex-1 text-center py-2 px-3 text-xs font-bold rounded-md transition-all ${
              isActive
                ? persona.id === "piyush"
                  ? "bg-pink-600 text-white shadow-sm"
                  : "bg-zinc-200 text-zinc-900 shadow-sm"
                : persona.id === "piyush"
                  ? "text-zinc-400 hover:text-pink-400 hover:bg-zinc-700"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
            }`}
          >
            {persona.name}
          </button>
        );
      })}
    </div>
  );
}
