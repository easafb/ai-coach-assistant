"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Dumbbell, Play } from "lucide-react";

import {
  startWorkoutAction,
  logSetAction,
  finishWorkoutAction,
} from "@/app/actions/workoutActions";
import type { RoutineExercise } from "@/types";

interface Props {
  routineId: string;
  exercises: RoutineExercise[];
}

export default function ActiveWorkout({ routineId, exercises }: Props) {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [loggedSets, setLoggedSets] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Oturum yalnızca kullanıcı "Başlat"a bastığında açılıyor.
  // Eski kod sayfa açılır açılmaz session yaratıyordu; vazgeçen her kullanıcı
  // veritabanında yarım kayıt bırakıyordu (dev'de StrictMode yüzünden iki tane).
  const hasStarted = sessionId !== null;

  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [hasStarted]);

  const weightInput = useRef<HTMLInputElement>(null);

  const formatTime = (total: number) =>
    `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

  const handleStart = () => {
    setError(null);
    startTransition(async () => {
      const result = await startWorkoutAction(routineId);
      if (result.ok) setSessionId(result.data.sessionId);
      else setError(result.error);
    });
  };

  const handleLogSet = () => {
    if (!sessionId) return;

    const weightNum = Number.parseFloat(weight);
    const repsNum = Number.parseInt(reps, 10);

    if (!Number.isFinite(weightNum) || !Number.isInteger(repsNum) || repsNum < 1) {
      setError("Ağırlık ve tekrar alanlarını doldur.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await logSetAction(
        sessionId,
        exercises[index].exercise_name,
        weightNum,
        repsNum
      );

      if (result.ok) {
        setLoggedSets((n) => n + 1);
        setReps("");
        weightInput.current?.focus();
      } else {
        setError(result.error);
      }
    });
  };

  const handleFinish = () => {
    if (!sessionId) return;
    setError(null);
    startTransition(async () => {
      const result = await finishWorkoutAction(sessionId);
      if (result.ok) router.push(`/workout/summary/${sessionId}`);
      else setError(result.error);
    });
  };

  if (!hasStarted) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#050505] p-6 text-white">
        <div className="w-full max-w-md text-center">
          <Dumbbell className="mx-auto mb-6 text-blue-500" size={48} />
          <h1 className="mb-2 text-3xl font-black tracking-tighter">Hazır mısın?</h1>
          <p className="mb-8 text-sm text-neutral-500">
            {exercises.length} egzersiz seni bekliyor.
          </p>

          {error && (
            <p role="alert" className="mb-4 text-sm font-medium text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-5 text-lg font-black disabled:opacity-50"
          >
            <Play size={20} fill="currentColor" />
            {isPending ? "Başlatılıyor..." : "Antrenmanı Başlat"}
          </button>
        </div>
      </main>
    );
  }

  const current = exercises[index];
  const isLast = index === exercises.length - 1;

  return (
    <main className="min-h-dvh bg-[#050505] p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex items-center justify-between rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Süre</p>
            <p className="font-mono text-2xl font-bold text-orange-400">
              {formatTime(seconds)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-neutral-500">Kaydedilen set</p>
            <p className="font-mono text-2xl font-bold text-blue-400">{loggedSets}</p>
          </div>
        </div>

        <div className="mb-6 rounded-[2.5rem] bg-white p-8 text-black shadow-2xl">
          <div className="mb-6 flex items-start justify-between">
            <span className="rounded-full bg-blue-100 px-4 py-1 text-xs font-black uppercase text-blue-600">
              Egzersiz {index + 1}/{exercises.length}
            </span>
            <Dumbbell size={24} className="text-neutral-300" />
          </div>

          <h1 className="mb-2 text-4xl font-black leading-tight">
            {current.exercise_name}
          </h1>
          <p className="mb-8 font-bold text-neutral-400">
            Hedef: {current.default_sets} × {current.default_reps}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-neutral-100 p-4">
              <label
                htmlFor="weight"
                className="mb-1 block text-[10px] font-black uppercase text-neutral-400"
              >
                Ağırlık (kg)
              </label>
              <input
                id="weight"
                ref={weightInput}
                type="number"
                inputMode="decimal"
                className="w-full bg-transparent text-2xl font-bold focus:outline-none"
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="rounded-2xl bg-neutral-100 p-4">
              <label
                htmlFor="reps"
                className="mb-1 block text-[10px] font-black uppercase text-neutral-400"
              >
                Tekrar
              </label>
              <input
                id="reps"
                type="number"
                inputMode="numeric"
                className="w-full bg-transparent text-2xl font-bold focus:outline-none"
                placeholder="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleLogSet}
            disabled={isPending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-5 text-lg font-black text-white transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 size={20} /> {isPending ? "Kaydediliyor..." : "Seti Kaydet"}
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-900 py-4 font-bold disabled:opacity-40"
          >
            Önceki
          </button>

          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={isPending}
              className="flex-[2] rounded-2xl bg-red-600 py-4 font-bold shadow-lg shadow-red-900/20 disabled:opacity-50"
            >
              Antrenmanı Bitir
            </button>
          ) : (
            <button
              onClick={() => setIndex((i) => Math.min(exercises.length - 1, i + 1))}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold shadow-lg shadow-blue-900/20"
            >
              Sonraki Egzersiz <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
