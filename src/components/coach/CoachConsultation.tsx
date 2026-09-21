"use client";

import { useState, useTransition } from "react";
import {
  Send,
  Loader2,
  AlertTriangle,
  Activity,
  ArrowLeftRight,
  TrendingDown,
  Ban,
} from "lucide-react";

import { requestCoachPlan, type CoachPlan } from "@/services/aiService";
import { saveAdjustmentsAction } from "@/app/actions/workoutActions";
import type { AdjustmentAction } from "@/lib/adjustments";

const ICON: Record<AdjustmentAction, typeof Ban> = {
  reduce_load: TrendingDown,
  swap: ArrowLeftRight,
  skip: Ban,
};

const LABEL: Record<AdjustmentAction, string> = {
  reduce_load: "Yükü hafiflet",
  swap: "Hareketi değiştir",
  skip: "Bugün atla",
};

export default function CoachConsultation() {
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const consult = () => {
    setError(null);
    setApplied(false);
    startTransition(async () => {
      const result = await requestCoachPlan(input);
      if (result.ok) {
        setPlan(result.data);
      } else {
        setPlan(null);
        setError(result.error);
      }
    });
  };

  const apply = () => {
    if (!plan) return;
    setError(null);
    startTransition(async () => {
      const result = await saveAdjustmentsAction(plan.adjustments);
      if (result.ok) {
        setApplied(true);
        setPlan(null);
        setInput("");
      } else {
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
          placeholder="Örn. Bench press sırasında sol omzumda keskin bir ağrı hissediyorum, dün de kötü uyudum..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
        />
        <button
          onClick={consult}
          disabled={isPending || input.trim().length < 10}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-black transition-all active:scale-95 disabled:opacity-30"
        >
          {isPending && !plan ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Programın inceleniyor...
            </>
          ) : (
            <>
              <Send size={18} /> Programımı Ayarla
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

      {applied && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400"
        >
          Programın güncellendi. Bir sonraki antrenmanında bu değişiklikleri göreceksin.
        </p>
      )}

      {plan && (
        <div className="animate-rise rounded-[2.5rem] border border-blue-500/20 bg-blue-600/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            <span className="text-xs font-black uppercase text-blue-500">
              Antrenörün Kararı
            </span>
          </div>

          <p className="mb-6 font-medium leading-relaxed text-slate-200">{plan.summary}</p>

          {plan.seekMedicalAttention && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
            >
              <AlertTriangle className="mt-0.5 shrink-0 text-red-400" size={18} />
              <p className="text-sm font-semibold leading-snug text-red-300">
                Tarif ettiğin belirtiler bir sağlık profesyoneli tarafından
                değerlendirilmeli. Lütfen antrenmana devam etmeden önce bir hekime başvur.
              </p>
            </div>
          )}

          {plan.adjustments.length === 0 ? (
            <p className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">
              Programında değiştirilmesi gereken bir hareket görmüyorum. Planına
              olduğu gibi devam edebilirsin.
            </p>
          ) : (
            <>
              <ul className="mb-6 space-y-2">
                {plan.adjustments.map((adjustment) => {
                  const Icon = ICON[adjustment.action];
                  return (
                    <li
                      key={adjustment.exerciseKey}
                      className="flex items-start gap-3 rounded-2xl bg-white/5 p-4"
                    >
                      <Icon size={18} className="mt-0.5 shrink-0 text-blue-400" />
                      <div className="min-w-0">
                        <p className="font-bold">
                          {adjustment.exerciseName}
                          {adjustment.substituteName && (
                            <span className="font-medium text-slate-400">
                              {" → "}
                              {adjustment.substituteName}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                          {LABEL[adjustment.action]}
                        </p>
                        <p className="mt-1 text-sm leading-snug text-slate-400">
                          {adjustment.reason}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Değişiklik kullanıcı onaylamadan programa girmiyor. */}
              <button
                onClick={apply}
                disabled={isPending}
                className="min-h-12 w-full rounded-2xl bg-blue-600 py-4 font-black transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending ? "Uygulanıyor..." : "Programıma uygula"}
              </button>
            </>
          )}

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
