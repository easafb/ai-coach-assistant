"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ChevronLeft } from "lucide-react";

import { createRoutineAction } from "@/app/actions/workoutActions";

interface ExerciseInput {
  name: string;
  sets: string;
  reps: string;
}

const emptyExercise = (): ExerciseInput => ({ name: "", sets: "3", reps: "10" });

export default function NewRoutinePage() {
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
          reps: Number.parseInt(ex.reps, 10) || 0,
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

        <h1 className="mb-8 text-3xl font-black">
          Yeni <span className="text-blue-500">Program</span>
        </h1>

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
                <input
                  placeholder="Egzersiz adı"
                  className="mb-4 w-full bg-transparent text-lg font-bold outline-none placeholder:text-slate-600"
                  value={ex.name}
                  onChange={(e) => updateExercise(index, "name", e.target.value)}
                />
                <div className="flex items-end gap-4">
                  <div className="flex-1">
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
                      Tekrar
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="w-full bg-transparent font-bold outline-none"
                      value={ex.reps}
                      onChange={(e) => updateExercise(index, "reps", e.target.value)}
                    />
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
