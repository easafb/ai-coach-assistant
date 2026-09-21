"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ChevronLeft } from "lucide-react";

import { createRoutineAction } from "@/app/actions/workoutActions";
import ExercisePicker from "@/components/routines/ExercisePicker";
import { findExercise } from "@/lib/exercises";

interface ExerciseInput {
  name: string;
  sets: string;
  minReps: string;
  maxReps: string;
}

// Tekrar aralığı: alt uçtan başlanır, tüm setler üst uca ulaşınca ağırlık artar.
const emptyExercise = (): ExerciseInput => ({
  name: "",
  sets: "3",
  minReps: "8",
  maxReps: "12",
});

export default function NewRoutinePage({
  customKeys,
}: {
  customKeys: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<ExerciseInput[]>([emptyExercise()]);
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
  const pickExercise = (index: number, name: string) => {
    const known = findExercise(name);
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== index) return ex;
        if (!known) return { ...ex, name };
        return known.type === "compound"
          ? { ...ex, name, minReps: "8", maxReps: "8" }
          : { ...ex, name, minReps: "10", maxReps: "15" };
      })
    );
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

    setError(null);
    startTransition(async () => {
      const result = await createRoutineAction(
        name,
        exercises.map((ex) => ({
          name: ex.name,
          sets: Number.parseInt(ex.sets, 10) || 0,
          minReps: Number.parseInt(ex.minReps, 10) || 0,
          maxReps: Number.parseInt(ex.maxReps, 10) || 0,
        }))
      );

      // Eski kod hata durumunu tamamen yutuyordu: kayıt başarısız olsa bile
      // kullanıcı hiçbir geri bildirim almıyordu.
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
            className="flex items-center gap-2 font-bold text-slate-400 transition-colors hover:text-white"
          >
            <ChevronLeft size={20} /> Geri
          </button>
          <Link
            href="/dashboard"
            className="rounded-full bg-white/5 px-4 py-2 text-sm font-bold text-slate-400 transition-all hover:text-white"
          >
            Panel
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-black">
          Yeni <span className="text-blue-500">Program</span>
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
                <div className="mb-4">
                  <ExercisePicker
                    value={ex.name}
                    onChange={(name) => pickExercise(index, name)}
                    customKeys={customKeys}
                  />
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
                      {ex.minReps === ex.maxReps ? "Tekrar" : "Tekrar aralığı"}
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
                    className="pb-1 text-red-500/50 transition-colors hover:text-red-500 disabled:opacity-20"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setExercises((prev) => [...prev, emptyExercise()])}
            className="flex w-full items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-white/10 py-4 font-bold text-slate-400"
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
            className="w-full rounded-[2rem] bg-blue-500 py-5 text-lg font-black text-white active:scale-95 disabled:opacity-50"
          >
            {isPending ? "Kaydediliyor..." : "Rutini Kaydet"}
          </button>
        </div>
      </div>
    </main>
  );
}
