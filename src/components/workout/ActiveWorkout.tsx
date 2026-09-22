"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Play,
  TrendingUp,
  ArrowLeftRight,
  Ban,
  HelpCircle,
  RotateCw,
  CloudOff,
} from "lucide-react";

import {
  startWorkoutAction,
  logSetAction,
  finishWorkoutAction,
} from "@/app/actions/workoutActions";
import type { ProgressionDecision } from "@/lib/progression";
import type { WorkoutPlanItem } from "@/lib/adjustments";
import type { OpenSession } from "@/lib/queries";
import { normalizeExerciseName } from "@/lib/progression";
import { useWakeLock } from "@/hooks/useWakeLock";
import RestTimer, { DEFAULT_REST } from "@/components/workout/RestTimer";
import {
  enqueue,
  dequeue,
  pendingFor,
  isDefinitelyOffline,
  newClientId,
  type PendingSet,
} from "@/lib/offlineQueue";
import ExerciseClassifier from "@/components/routines/ExerciseClassifier";

interface Props {
  routineId: string;
  plan: WorkoutPlanItem[];
  /** Yarım kalmış antrenman varsa devam edilebilsin diye. */
  openSession: OpenSession | null;
}

const DECISION_LABEL: Record<ProgressionDecision, string> = {
  "first-time": "İlk kez",
  "add-weight": "Ağırlık +",
  "add-reps": "Tekrar +",
  repeat: "Tekrar",
  deload: "Deload",
};

const DECISION_STYLE: Record<ProgressionDecision, string> = {
  "first-time": "bg-neutral-200 text-neutral-700",
  "add-weight": "bg-emerald-100 text-emerald-700",
  "add-reps": "bg-blue-100 text-blue-700",
  repeat: "bg-amber-100 text-amber-700",
  deload: "bg-orange-100 text-orange-700",
};

export default function ActiveWorkout({ routineId, plan, openSession }: Props) {
  const router = useRouter();

  // Atlanan hareketler seansın dışında; plan ekranında yine de gösteriliyorlar.
  const active = plan.filter((item) => !item.prescription.skipped);
  const skipped = plan.filter((item) => item.prescription.skipped);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  /**
   * Devam edilen antrenmanda daha önce kaydedilmiş setler geri yükleniyor;
   * yoksa ilerleme noktaları sıfırdan başlar ve kullanıcı setleri iki kez
   * yaptığını sanır.
   */
  const [setsByExercise, setSetsByExercise] = useState<Record<string, number>>(() => {
    if (!openSession) return {};
    const counts: Record<string, number> = {};
    for (const item of plan) {
      const logged = openSession.setCounts[normalizeExerciseName(item.performedName)];
      if (logged) counts[item.exerciseId] = logged;
    }
    return counts;
  });
  const [error, setError] = useState<string | null>(null);
  const [classifying, setClassifying] = useState<string | null>(null);
  // Set kaydedilince artan sayaç; RestTimer bunu görünce baştan başlıyor.
  const [restTick, setRestTick] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  // Sunucuya gönderilmeyi bekleyen set sayısı; arayüzde gösteriliyor.
  const [pendingCount, setPendingCount] = useState(0);
  // Kuyruk boşalınca antrenmanı bitirmeyi bekleyen bayrak.
  const [finishWhenSynced, setFinishWhenSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasStarted = sessionId !== null;

  // Antrenman sürerken ekran sönmesin: setler arasında telefon cebe giriyor.
  useWakeLock(hasStarted);

  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [hasStarted]);

  const weightInput = useRef<HTMLInputElement>(null);
  // Aynı anda iki boşaltma çalışırsa aynı set iki kez gönderilir; idempotency
  // bunu zaten güvenli kılıyor ama gereksiz istek de atmıyoruz.
  const flushing = useRef(false);

  const loggedSoFar = Object.values(setsByExercise).reduce((a, b) => a + b, 0);

  // Egzersize geçişte alanları reçeteyle dolduruyoruz; effect yerine index'in
  // fiilen değiştiği yerde yapıyoruz ki ardışık render tetiklenmesin.
  // useCallback bilerek yok: React Compiler memoizasyonu kendisi hallediyor,
  // elle sarmalamak derleyicinin optimizasyonu atlamasına yol açıyordu.
  const goToExercise = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(active.length - 1, nextIndex));
    const item = active[clamped];
    setIndex(clamped);
    setWeight(item?.prescription.weight != null ? String(item.prescription.weight) : "");
    setReps(item ? String(item.prescription.reps) : "");
    setError(null);
  };

  const formatTime = (total: number) =>
    `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

  const handleStart = () => {
    setError(null);
    startTransition(async () => {
      const result = await startWorkoutAction(routineId);
      if (result.ok) {
        setSessionId(result.data.sessionId);
        goToExercise(0);
      } else {
        setError(result.error);
      }
    });
  };

  /**
   * Kuyruktaki setleri sırayla gönderir.
   * Bir istek başarısız olursa durur: sıra korunmalı ve bağlantı yokken
   * kalan istekleri denemenin anlamı yok.
   */
  const flushQueue = async (sid: string) => {
    if (flushing.current) return;
    flushing.current = true;

    try {
      for (const item of pendingFor(sid)) {
        const result = await logSetAction(
          item.sessionId,
          item.exerciseName,
          item.weight,
          item.reps,
          item.clientId
        );
        if (!result.ok) break;
        dequeue(item.clientId);
      }
    } catch {
      // Ağ hatası: kuyruk duruyor, bağlantı gelince tekrar denenecek.
    } finally {
      flushing.current = false;
      setPendingCount(pendingFor(sid).length);
    }
  };

  // Bağlantı geri geldiğinde kuyruğu boşalt ve durumu arayüze yansıt.
  useEffect(() => {
    if (!sessionId) return;

    const onOnline = () => {
      setOffline(false);
      void flushQueue(sessionId);
    };
    const onOffline = () => setOffline(true);

    setOffline(isDefinitelyOffline());
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void flushQueue(sessionId);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [sessionId]);

  const handleLogSet = () => {
    if (!sessionId) return;

    const weightNum = Number.parseFloat(weight);
    const repsNum = Number.parseInt(reps, 10);

    if (!Number.isFinite(weightNum) || !Number.isInteger(repsNum) || repsNum < 1) {
      setError("Ağırlık ve tekrar alanlarını doldur.");
      return;
    }

    // Fiilen yapılan hareketi logluyoruz: swap varsa ikamenin adı gider,
    // böylece geçmiş gerçekte yapılanı yansıtır.
    const item: PendingSet = {
      clientId: newClientId(),
      sessionId,
      exerciseName: active[index].performedName,
      weight: weightNum,
      reps: repsNum,
      queuedAt: new Date().toISOString(),
    };

    // ÖNCE YEREL, SONRA SUNUCU: arayüz sunucuyu beklemiyor ve sinyal
    // kesikse set kaybolmuyor.
    enqueue(item);
    setError(null);

    const id = active[index].exerciseId;
    setSetsByExercise((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setReps(String(active[index].prescription.reps));
    setRestSeconds(DEFAULT_REST[active[index].exerciseType]);
    setRestTick((t) => t + 1);
    setPendingCount(pendingFor(sessionId).length);
    weightInput.current?.focus();

    startTransition(async () => {
      await flushQueue(sessionId);
    });
  };

  const handleFinish = () => {
    if (!sessionId) return;
    setError(null);

    startTransition(async () => {
      // Hacim sunucuda set_logs'tan hesaplanıyor; bekleyen setler gönderilmeden
      // bitirmek eksik hacim kaydetmek demek.
      await flushQueue(sessionId);

      if (pendingFor(sessionId).length > 0) {
        setFinishWhenSynced(true);
        setError(
          "Bazı setler henüz gönderilemedi. Bağlantı gelince antrenman otomatik bitirilecek."
        );
        return;
      }

      const result = await finishWorkoutAction(sessionId);
      if (result.ok) router.push(`/workout/summary/${sessionId}`);
      else setError(result.error);
    });
  };

  // Kuyruk boşaldıysa ve kullanıcı bitirmek istemişse otomatik tamamla.
  useEffect(() => {
    if (!finishWhenSynced || !sessionId || pendingCount > 0) return;
    setFinishWhenSynced(false);
    void (async () => {
      const result = await finishWorkoutAction(sessionId);
      if (result.ok) router.push(`/workout/summary/${sessionId}`);
    })();
  }, [finishWhenSynced, pendingCount, sessionId, router]);

  // ---------------------------------------------------------------- başlangıç
  if (!hasStarted) {
    return (
      <main className="min-h-dvh bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-md py-10">
          {openSession ? (
            <RotateCw className="mb-6 text-amber-500" size={40} />
          ) : (
            <Dumbbell className="mb-6 text-blue-500" size={40} />
          )}
          <h1 className="mb-1 text-3xl font-black tracking-tighter">
            {openSession ? "Antrenmana devam et" : "Bugünün planı"}
          </h1>
          <p className="mb-8 text-sm text-neutral-500">
            {openSession
              ? `Bu antrenmanda ${loggedSoFar} set kaydetmişsin. Kaldığın yerden sürdür.`
              : "Geçmiş antrenmanlarına göre hazırlandı."}
          </p>

          <ul className="stagger-children mb-8 space-y-3">
            {active.map((item) => (
              <li
                key={item.exerciseId}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">
                    {item.performedName}
                    {item.prescription.adjustment?.action === "swap" && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-500">
                        <ArrowLeftRight size={11} /> {item.originalName} yerine
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      DECISION_STYLE[item.prescription.decision]
                    }`}
                  >
                    {DECISION_LABEL[item.prescription.decision]}
                  </span>
                </div>
                <p className="mt-1 font-mono text-lg font-bold text-blue-400">
                  {item.prescription.weight != null
                    ? `${item.prescription.weight} kg`
                    : "— kg"}
                  <span className="text-neutral-600"> × </span>
                  {item.targetSets} × {item.prescription.reps}
                  {item.maxReps > item.minReps && (
                    <span className="ml-2 text-xs font-medium text-neutral-500">
                      (aralık {item.minReps}-{item.maxReps})
                    </span>
                  )}
                </p>

                {/* Sınıflandırılmamış hareket: artış adımı tahmine düşüyor ve
                    AI ikame öneremiyor. Kullanıcıya düzeltme yolu sunuyoruz. */}
                {!item.classified &&
                  (classifying === item.originalName ? (
                    <div className="mt-3">
                      <ExerciseClassifier
                        name={item.originalName}
                        onDone={() => {
                          setClassifying(null);
                          router.refresh();
                        }}
                        onCancel={() => setClassifying(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setClassifying(item.originalName)}
                      className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 text-left text-xs font-bold text-amber-400"
                    >
                      <HelpCircle size={14} className="shrink-0" />
                      Bu hareket sınıflandırılmamış — kas grubunu seç
                    </button>
                  ))}
              </li>
            ))}

            {skipped.map((item) => (
              <li
                key={item.exerciseId}
                className="flex items-start gap-3 rounded-2xl border border-neutral-900 bg-neutral-900/20 p-4 opacity-60"
              >
                <Ban size={16} className="mt-1 shrink-0 text-amber-500" />
                <div>
                  <p className="font-bold line-through decoration-neutral-600">
                    {item.originalName}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                    Bugün atlanıyor
                  </p>
                  {item.prescription.adjustment && (
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.prescription.adjustment.reason}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {error && (
            <p role="alert" className="mb-4 text-sm font-medium text-red-400">
              {error}
            </p>
          )}

          {active.length === 0 ? (
            <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
              Bu programdaki tüm hareketler şu an atlanıyor. Koç sayfasından
              değişiklikleri kaldırabilirsin.
            </p>
          ) : (
            <button
              onClick={handleStart}
              disabled={isPending}
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl py-5 text-lg font-black disabled:opacity-50 ${
                openSession ? "bg-amber-500 text-black" : "bg-blue-600 text-white"
              }`}
            >
              {isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : openSession ? (
                <RotateCw size={20} />
              ) : (
                <Play size={20} fill="currentColor" />
              )}
              {isPending
                ? "Yükleniyor..."
                : openSession
                  ? "Devam Et"
                  : "Antrenmanı Başlat"}
            </button>
          )}
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------------- aktif
  const current = active[index];
  const isLast = index === active.length - 1;
  const doneSets = setsByExercise[current.exerciseId] ?? 0;
  const targetSets = current.targetSets;
  const totalSets = Object.values(setsByExercise).reduce((a, b) => a + b, 0);
  const targetReached = doneSets >= targetSets;

  return (
    <main
      className={`min-h-dvh bg-[#050505] p-6 text-white ${
        restTick > 0 ? "pb-40" : ""
      }`}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex items-center justify-between rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Süre</p>
            <p className="font-mono text-2xl font-bold text-orange-400">
              {formatTime(seconds)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-neutral-500">Toplam set</p>
            <p className="font-mono text-2xl font-bold text-blue-400">{totalSets}</p>
          </div>
        </div>

        {/* Setler yerel olarak kaydedildi ama henüz gönderilmedi. Kullanıcı
            verisinin kaybolmadığını bilmeli; sessizce beklemek endişe yaratır. */}
        {(offline || pendingCount > 0) && (
          <div
            role="status"
            className="animate-rise mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
          >
            <CloudOff size={18} className="shrink-0 text-amber-500" />
            <p className="text-sm font-medium leading-snug text-amber-200">
              {pendingCount > 0
                ? `${pendingCount} set cihazına kaydedildi, bağlantı gelince gönderilecek.`
                : "İnternet yok. Setlerin cihazına kaydediliyor, bağlantı gelince gönderilecek."}
            </p>
          </div>
        )}

        <div
          key={current.exerciseId}
          className="animate-rise mb-6 rounded-[2.5rem] bg-white p-8 text-black shadow-2xl"
        >
          <div className="mb-6 flex items-start justify-between">
            <span className="rounded-full bg-blue-100 px-4 py-1 text-xs font-black uppercase text-blue-600">
              Egzersiz {index + 1}/{active.length}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                DECISION_STYLE[current.prescription.decision]
              }`}
            >
              {DECISION_LABEL[current.prescription.decision]}
            </span>
          </div>

          <h1 className="mb-1 text-4xl font-black leading-tight">
            {current.performedName}
          </h1>
          {current.prescription.adjustment?.action === "swap" && (
            <p className="mb-3 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600">
              <ArrowLeftRight size={12} /> {current.originalName} yerine
            </p>
          )}

          <div className="mb-6 mt-4 flex items-start gap-2 rounded-2xl bg-neutral-100 p-4">
            <TrendingUp size={16} className="mt-0.5 shrink-0 text-blue-600" />
            <p className="text-sm font-medium leading-snug text-neutral-700">
              {current.prescription.rationale}
            </p>
          </div>

          <div className="mb-8 flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: Math.max(targetSets, doneSets) }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${
                    i < doneSets
                      ? i < targetSets
                        ? "bg-blue-500"
                        : "bg-emerald-500"
                      : "bg-neutral-200"
                  }`}
                />
              ))}
            </div>
            <span
              className={`text-sm font-black ${
                targetReached ? "text-emerald-600" : "text-neutral-400"
              }`}
            >
              {doneSets} / {targetSets} set
            </span>
          </div>

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
                step="2.5"
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
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black py-5 text-lg font-black text-white transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <CheckCircle2 size={20} />
            )}
            {isPending
              ? "Kaydediliyor..."
              : targetReached
                ? "Fazladan Set Kaydet"
                : "Seti Kaydet"}
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => goToExercise(index - 1)}
            disabled={index === 0}
            className="min-h-12 flex-1 rounded-2xl border border-neutral-800 bg-neutral-900 py-4 font-bold disabled:opacity-40"
          >
            Önceki
          </button>

          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={isPending}
              className="min-h-12 flex-[2] rounded-2xl bg-red-600 py-4 font-bold shadow-lg shadow-red-900/20 disabled:opacity-50"
            >
              Antrenmanı Bitir
            </button>
          ) : (
            <button
              onClick={() => goToExercise(index + 1)}
              className={`flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-2xl py-4 font-bold transition-all ${
                targetReached
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-400/40"
                  : "bg-blue-600 shadow-lg shadow-blue-900/20"
              }`}
            >
              {targetReached ? "Hedef tamam — Sonraki" : "Sonraki Egzersiz"}
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {restTick > 0 && (
        <RestTimer
          key={restTick}
          seconds={restSeconds}
          onDismiss={() => setRestTick(0)}
        />
      )}
    </main>
  );
}
