"use client";

import { useState, useTransition } from "react";

import { createCustomExerciseAction } from "@/app/actions/workoutActions";
import type { MuscleGroup, ExerciseType, ExerciseUnit } from "@/lib/exercises";

const GROUPS: MuscleGroup[] = ["göğüs", "sırt", "omuz", "kol", "bacak", "karın"];

interface Props {
  name: string;
  onDone: (savedName: string) => void;
  onCancel: () => void;
}

/**
 * Katalogda olmayan bir hareketi sınıflandırma formu.
 * İki yerden kullanılıyor: yeni rutin oluştururken (ExercisePicker) ve
 * mevcut rutindeki sınıflandırılmamış bir hareketi düzeltirken
 * (antrenman planı ekranı).
 */
export default function ExerciseClassifier({ name, onDone, onCancel }: Props) {
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [type, setType] = useState<ExerciseType>("compound");
  const [unit, setUnit] = useState<ExerciseUnit>("reps");
  const [minStep, setMinStep] = useState<1.25 | 2.5 | 5>(2.5);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (!group) return;
    setError(null);
    startTransition(async () => {
      const result = await createCustomExerciseAction(name, group, type, unit, minStep);
      if (result.ok) onDone(result.data.name);
      else setError(result.error);
    });
  };

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-600/10 p-4 text-white">
      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
        Hareketi sınıflandır
      </p>
      <p className="mb-4 text-lg font-bold">{name}</p>

      <p className="mb-2 text-xs font-bold text-slate-400">Hangi kas grubu?</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              setGroup(g);
              // Bacak bileşikleri daha büyük plakalarla çalışılır.
              setMinStep(g === "bacak" ? 5 : 2.5);
            }}
            className={`min-h-11 rounded-xl px-4 text-sm font-bold capitalize transition-colors ${
              group === g ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-bold text-slate-400">Nasıl ölçülüyor?</p>
      <div className="mb-4 flex gap-2">
        {(["reps", "seconds"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold transition-colors ${
              unit === u ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            {u === "reps" ? "Tekrar" : "Süre (saniye)"}
          </button>
        ))}
      </div>
      <p className="mb-4 text-[11px] leading-snug text-slate-500">
        Plank gibi sabit duruşlar süreyle ölçülür; kaldırma hareketleri
        tekrarla.
      </p>

      <p className="mb-2 text-xs font-bold text-slate-400">Hareket tipi?</p>
      <div className="mb-4 flex gap-2">
        {(["compound", "isolation"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              // İzolasyon hareketleri mikro plakayla daha ince ilerleyebilir.
              if (t === "isolation") setMinStep(1.25);
            }}
            className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold transition-colors ${
              type === t ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            {t === "compound" ? "Bileşik" : "İzolasyon"}
          </button>
        ))}
      </div>
      <p className="mb-4 text-[11px] leading-snug text-slate-500">
        Bileşik: birden fazla eklemi çalıştırır (squat, bench, row). İzolasyon:
        tek kası hedefler (lateral raise, curl) ve daha yavaş ilerler.
      </p>

      <p className="mb-2 text-xs font-bold text-slate-400">
        Salonda yapabildiğin en küçük ağırlık artışı?
      </p>
      <div className="mb-4 flex gap-2">
        {([1.25, 2.5, 5] as const).map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setMinStep(step)}
            className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold transition-colors ${
              minStep === step ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            {step} kg
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="min-h-11 flex-1 rounded-xl border border-white/10 text-sm font-bold text-slate-300 disabled:opacity-50"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isPending || !group}
          className="min-h-11 flex-[2] rounded-xl bg-blue-600 text-sm font-black disabled:opacity-40"
        >
          {isPending ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
