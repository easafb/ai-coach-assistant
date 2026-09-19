"use client";

import { useState, useTransition } from "react";
import { Send, AlertTriangle, Activity } from "lucide-react";

import { getCoachAdvice } from "@/services/aiService";

export default function CoachConsultation() {
  const [input, setInput] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await getCoachAdvice(input);
      if (result.ok) {
        setAdvice(result.data.advice);
      } else {
        setAdvice(null);
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-white/5 bg-neutral-900/50 p-6">
        <label
          htmlFor="condition"
          className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-slate-500"
        >
          Durumun / Ağrın
        </label>
        <textarea
          id="condition"
          className="min-h-[120px] w-full resize-none bg-transparent text-lg font-medium outline-none placeholder:text-neutral-700"
          placeholder="Örn. Bench press sırasında sol omzumda keskin bir ağrı hissediyorum..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || input.trim().length < 3}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-black transition-all active:scale-95 disabled:opacity-30"
        >
          {isPending ? (
            "Analiz ediliyor..."
          ) : (
            <>
              <Send size={18} /> Tavsiye Al
            </>
          )}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400"
        >
          {error}
        </p>
      )}

      {advice && (
        <div className="rounded-[2.5rem] border border-blue-500/20 bg-blue-600/10 p-8">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            <span className="text-xs font-black uppercase text-blue-500">
              Antrenörün Kararı
            </span>
          </div>
          <p className="font-medium leading-relaxed text-slate-200">{advice}</p>

          <div className="mt-6 flex items-start gap-3 border-t border-white/5 pt-6">
            <AlertTriangle className="shrink-0 text-amber-500" size={18} />
            <p className="text-[10px] font-bold uppercase leading-tight text-slate-500">
              Bu bir tıbbi tavsiye değildir. Şiddetli ağrı hissediyorsan lütfen bir
              sağlık profesyoneline başvur.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
