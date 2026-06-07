"use client";

import { useState } from "react";

export function SendOfferButton({ requestId }: { requestId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendOffer() {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      });

      if (!response.ok) throw new Error(await response.text());
      setMessage("Teklif mesajı gönderildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gönderim hatası");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={sendOffer}
        disabled={isLoading}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Gönderiliyor..." : "WhatsApp Teklif Gönder"}
      </button>
      {message ? <p className="max-w-xs text-right text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
