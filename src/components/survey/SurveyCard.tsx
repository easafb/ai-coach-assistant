"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { dismissSurveyAction, submitSurveyAction } from "@/app/actions/surveyActions";
import { EXPERIENCES, GOALS, SOURCES } from "@/lib/survey";

type Answers = {
  goal?: keyof typeof GOALS;
  experience?: keyof typeof EXPERIENCES;
  source?: keyof typeof SOURCES;
};

const QUESTIONS = [
  { key: "goal", title: "Asıl hedefin ne?", options: GOALS },
  { key: "experience", title: "Ne zamandır düzenli ağırlık çalışıyorsun?", options: EXPERIENCES },
  { key: "source", title: "Coach.ai'ı nereden duydun?", options: SOURCES },
] as const;

/**
 * İlk antrenmanın özet ekranında bir kez gösterilen üç soruluk anket.
 * Yazı yazdırmıyor, sadece dokunma: salondan çıkarken cevaplanabilsin.
 */
export default function SurveyCard() {
  const [answers, setAnswers] = useState<Answers>({});
  const [state, setState] = useState<"open" | "done" | "dismissed">("open");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const complete = Boolean(answers.goal && answers.experience && answers.source);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitSurveyAction(answers);
      if (result.ok) setState("done");
      else setError(result.error);
    });
  };

  const dismiss = () => {
    // Kullanıcı "şimdi değil" dediyse kartı hemen kaldır; kayıt başarısız
    // olursa en kötü ihtimalle bir sonraki antrenmanda yeniden sorulur.
    setState("dismissed");
    startTransition(async () => {
      await dismissSurveyAction();
    });
  };

  if (state === "dismissed") return null;

  if (state === "done") {
    return (
      <div
        role="status"
        className="animate-rise mb-6 flex items-center gap-3 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-5"
      >
        <Check size={18} className="shrink-0 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-200">
          Teşekkürler! Cevapların uygulamayı geliştirmemize yardım edecek.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="survey-title"
      className="animate-rise mb-6 rounded-[2rem] border border-white/5 bg-[#1C1C1E] p-6"
    >
      <h2 id="survey-title" className="mb-1 text-lg font-black tracking-tight">
        Seni biraz tanıyalım
      </h2>
      <p className="mb-5 text-sm text-slate-400">Üç soru, on saniye.</p>

      <div className="space-y-5">
        {QUESTIONS.map((q) => (
          <fieldset key={q.key}>
            <legend className="mb-2 text-sm font-bold text-slate-200">{q.title}</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(q.options).map(([value, label]) => {
                const selected = answers[q.key] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: value }))}
                    className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
                      selected
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!complete || pending}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold transition-opacity disabled:opacity-40"
        >
          {pending && <Loader2 size={18} className="animate-spin" />}
          Gönder
        </button>
        <button
          type="button"
          onClick={dismiss}
          disabled={pending}
          className="min-h-12 px-4 text-sm font-bold text-slate-500 transition-colors hover:text-slate-300"
        >
          Şimdi değil
        </button>
      </div>
    </section>
  );
}
