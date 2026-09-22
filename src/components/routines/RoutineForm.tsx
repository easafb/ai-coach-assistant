"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ChevronLeft, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

import { createRoutineAction, updateRoutineAction } from "@/app/actions/workoutActions";
import ExercisePicker from "@/components/routines/ExercisePicker";
import { findExercise } from "@/lib/exercises";
import type { ExerciseDraft } from "@/types";

export interface ExerciseInput {
  name: string;
  sets: string;
  minReps: string;
  maxReps: string;
}

interface Props {
  /** Düzenleme modunda rutinin kimliği; oluşturma modunda verilmez. */
  routineId?: string;
  initialName?: string;
  initialExercises?: ExerciseInput[];
  customKeys: string[];
}

// Tekrar aralığı: alt uçtan başlanır, tüm setler üst uca ulaşınca ağırlık artar.
const emptyExercise = (): ExerciseInput => ({
  name: "",
  sets: "3",
  minReps: "8",
  maxReps: "12",
});

/**
 * Rutin oluşturma ve düzenleme formu.
 *
 * İkisi tek bileşen: alanlar, doğrulama ve tekrar hedefi mantığı birebir aynı.
 * Ayrı yazmak, birinde yapılan düzeltmenin diğerine geçmemesi demekti.
 */
export default function RoutineForm({
  routineId,
  initialName = "",
  initialExercises,
  customKeys,
}: Props) {
  const router = useRouter();
  const isEdit = routineId !== undefined;

  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<ExerciseInput[]>(
    initialExercises?.length ? initialExercises : [emptyExercise()]
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateExercise = (index: number, field: keyof ExerciseInput, value: string) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  /**
   * Hareket seçilince tekrar hedefini tipine göre kuruyoruz.
   * Bileşikte sabit tekrar: hedefi tutturunca ağırlık artar.
   * İzolasyonda aralık: 10 kg'lık bir lateral raise'e 2.5 kg eklemek %25
   * sıçrama demek; bu hareketler önce tekrar biriktirir.
   * Kullanıcı ikisini de elle değiştirebilir.
   */
  const pickExercise = (index: number, picked: string) => {
    const known = findExercise(picked);
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== index) return ex;
        if (!known) return { ...ex, name: picked };
        // Süreyle ölçülen hareketlerde tekrar varsayılanları anlamsız olurdu.
        if (known.unit === "seconds") {
          return { ...ex, name: picked, minReps: "30", maxReps: "60" };
        }
        return known.type === "compound"
          ? { ...ex, name: picked, minReps: "8", maxReps: "8" }
          : { ...ex, name: picked, minReps: "10", maxReps: "15" };
      })
    );
  };

  /** Sürükle-bırak yerine yukarı/aşağı: dokunmatikte belirgin şekilde güvenilir. */
  const move = (index: number, delta: number) => {
    setExercises((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Rutine bir isim ver.");
      return;
    }
    if (exercises.some((ex) => !ex.name.trim())) {
      setError("Tüm egzersiz isimlerini doldur.");
      return;
    }

    const payload: ExerciseDraft[] = exercises.map((ex) => ({
      name: ex.name,
      sets: Number.parseInt(ex.sets, 10) || 0,
      minReps: Number.parseInt(ex.minReps, 10) || 0,
      maxReps: Number.parseInt(ex.maxReps, 10) || 0,
    }));

    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateRoutineAction(routineId, name, payload)
        : await createRoutineAction(name, payload);

      if (result.ok) router.push("/dashboard");
      else setError(result.error);
    });
  };

  return (
    <main className="min-h-dvh bg-black p-6 pb-24 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex min-h-11 items-center gap-2 font-bold text-slate-400 transition-colors hover:text-white"
          >
            <ChevronLeft size={20} /> Geri
          </button>
          <Link
            href="/dashboard"
            className="flex min-h-11 items-center rounded-full bg-white/5 px-4 text-sm font-bold text-slate-400 transition-all hover:text-white"
          >
            Panel
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-black">
          {isEdit ? (
            <>
              Programı <span className="text-blue-500">Düzenle</span>
            </>
          ) : (
            <>
              Yeni <span className="text-blue-500">Program</span>
            </>
          )}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          Tekrar hedefi hareket tipine göre kurulur. Bileşik hareketlerde tek
          sayı: hedefi tutturunca ağırlık artar. İzolasyonlarda aralık: önce
          tekrar biriktirir, sonra ağırlık artar.
        </p>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/5 bg-[#1C1C1E] p-6">
            <label
              htmlFor="routine-name"
              className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-blue-500"
            >
              Rutin Adı
            </label>
            <input
              id="routine-name"
              type="text"
              placeholder="Örn. Üst Vücut"
              className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-slate-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {exercises.map((ex, index) => (
              <div
                key={index}
                className="rounded-[2rem] border border-white/5 bg-[#1C1C1E] p-6"
              >
                <div className="mb-4 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <ExercisePicker
                      value={ex.name}
                      onChange={(picked) => pickExercise(index, picked)}
                      customKeys={customKeys}
                    />
                  </div>

                  <div className="flex shrink-0 flex-col">
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Yukarı taşı"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-white disabled:opacity-20"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === exercises.length - 1}
                      aria-label="Aşağı taşı"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-white disabled:opacity-20"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <div className="w-14 shrink-0">
                    <label className="text-[10px] font-bold uppercase text-slate-500">
                      Set
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="w-full bg-transparent font-bold outline-none"
                      value={ex.sets}
                      onChange={(e) => updateExercise(index, "sets", e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">
                      {findExercise(ex.name)?.unit === "seconds"
                        ? "Süre (sn)"
                        : ex.minReps === ex.maxReps
                          ? "Tekrar"
                          : "Tekrar aralığı"}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        aria-label="En az tekrar"
                        className="w-12 bg-transparent font-bold outline-none"
                        value={ex.minReps}
                        onChange={(e) => updateExercise(index, "minReps", e.target.value)}
                      />
                      <span className="text-slate-600">–</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        aria-label="En fazla tekrar"
                        className="w-12 bg-transparent font-bold outline-none"
                        value={ex.maxReps}
                        onChange={(e) => updateExercise(index, "maxReps", e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setExercises((prev) => prev.filter((_, i) => i !== index))
                    }
                    disabled={exercises.length === 1}
                    aria-label="Egzersizi kaldır"
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-red-500/50 transition-colors hover:text-red-500 disabled:opacity-20"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setExercises((prev) => [...prev, emptyExercise()])}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-white/10 py-4 font-bold text-slate-400"
          >
            <Plus size={20} /> Egzersiz Ekle
          </button>

          {error && (
            <p role="alert" className="text-center text-sm font-medium text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[2rem] bg-blue-500 py-5 text-lg font-black text-white active:scale-95 disabled:opacity-50"
          >
            {isPending && <Loader2 size={20} className="animate-spin" />}
            {isPending
              ? "Kaydediliyor..."
              : isEdit
                ? "Değişiklikleri Kaydet"
                : "Rutini Kaydet"}
          </button>
        </div>
      </div>
    </main>
  );
}
