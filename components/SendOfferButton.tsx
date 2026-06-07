"use client";

import { useState } from "react";

export function SendOfferButton({ requestId }: { requestId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function sendOffer() {
    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Teklif mesajı gönderilemedi.");
      }

      setMessage("Teklif mesajı gönderildi.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Gönderim hatası.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={sendOffer}
        disabled={isLoading}
        className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Gönderiliyor..." : "Teklif Gönder"}
      </button>
      {message ? (
        <p className={`max-w-xs text-right text-xs ${isError ? "text-red-600" : "text-slate-500"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
