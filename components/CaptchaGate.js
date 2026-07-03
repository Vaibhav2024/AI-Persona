"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const EMOJI_MAP = {
  coffee: "☕",
  laptop: "💻",
  beer: "🍺",
  pizza: "🍕",
  phone: "📱",
  game: "🎮",
};

export default function CaptchaGate({ onUnlock }) {
  const [targetLabel, setTargetLabel] = useState("");
  const [options, setOptions] = useState([]);
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const fetchCaptcha = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/captcha");
      if (!res.ok) throw new Error("Failed to load captcha challenge.");
      const data = await res.json();
      setTargetLabel(data.targetLabel);
      setOptions(data.options);
      setCaptchaToken(data.captchaToken);
    } catch (err) {
      setError(err.message || "Error loading captcha. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSelectOption = async (selectedValue) => {
    if (verifying) return;

    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captchaToken, answer: selectedValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Incorrect selection. Please try again.");
      }

      onUnlock(data.sessionToken);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      fetchCaptcha();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-[20px] border border-zinc-200 bg-white p-6 shadow-xl text-zinc-900">
        <h3 className="text-base font-bold text-zinc-800 tracking-tight mb-1">
          Session Verification
        </h3>
        <p className="text-xs text-zinc-400 mb-5">
          Please click on the: <span className="font-semibold text-zinc-650">{targetLabel}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <RefreshCw size={24} className="animate-spin text-zinc-550" />
            <p className="text-xs text-zinc-400">Loading verification items...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Shuffled Choice Grid matching the 3x2 style in the image */}
            <div className="grid grid-cols-3 gap-3.5 justify-items-center">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  disabled={verifying}
                  aria-label={option.label}
                  title={option.label}
                  className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 active:scale-95 transition-all text-3xl disabled:opacity-50 disabled:pointer-events-none"
                >
                  {EMOJI_MAP[option.value] || "☕"}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={fetchCaptcha}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                disabled={verifying}
              >
                <RefreshCw size={14} className={verifying ? "animate-spin" : ""} />
                Refresh Captcha
              </button>
              <span className="text-[10px] text-zinc-350">Secure Session Gate</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
