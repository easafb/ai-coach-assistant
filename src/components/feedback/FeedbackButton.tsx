"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send } from "lucide-react";

import { submitFeedbackAction } from "@/app/actions/feedbackActions";

/**
 * Beta geri bildirim butonu.
 * Test edenlerin yaşadığı sorunların çoğu teknik hata değil kafa karışıklığı
 * olacak ("bu kilo saçma geldi"); hata takip araçları bunları göremiyor.
 * Uygulamadan çıkmadan bildirebilmeleri geri bildirim oranını artırıyor.
 */
export default function FeedbackButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const send = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitFeedbackAction(message, pathname);
      if (result.ok) {
        setSent(true);
        setMessage("");
      } else {
        setError(result.error);
      }
    });
  };

  const close = () => {
    setIsOpen(false);
    setSent(false);
    setError(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Geri bildirim gönder"
        className="fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-neutral-800/90 text-slate-300 shadow-lg backdrop-blur-xl transition-colors hover:text-white bottom-[calc(6.5rem+env(safe-area-inset-bottom))]"
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Geri bildirim"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Geri bildirim</h2>
            <p className="text-xs text-neutral-500">
              Beta sürümü — takıldığın ya da saçma bulduğun her şeyi yaz.
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Kapat"
            className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div>
            <p
              role="status"
              className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400"
            >
              Teşekkürler, iletildi.
            </p>
            <button
              onClick={close}
              className="min-h-12 w-full rounded-2xl bg-white font-bold text-black"
            >
              Kapat
            </button>
          </div>
        ) : (
          <>
            <textarea
              className="mb-4 min-h-[120px] w-full resize-none rounded-2xl bg-black/40 p-4 text-base text-white outline-none placeholder:text-neutral-600"
              placeholder="Örn. Bench press için önerdiği kilo bana çok ağır geldi..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
            />

            {error && (
              <p role="alert" className="mb-3 text-sm font-medium text-red-400">
                {error}
              </p>
            )}

            <button
              onClick={send}
              disabled={isPending || message.trim().length < 3}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-black text-white disabled:opacity-40"
            >
              <Send size={18} /> {isPending ? "Gönderiliyor..." : "Gönder"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
