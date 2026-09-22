import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import type { Routine, RoutineExercise, WorkoutSession } from "@/types";
import { normalizeExerciseName, type ExercisePerformance } from "@/lib/progression";
import type { Adjustment } from "@/lib/adjustments";
import {
  createResolver,
  type CustomExercise,
  type ExerciseResolver,
} from "@/lib/exercises";

// ==========================================
// OKUMA KATMANI
// Server Component'lerden doğrudan çağrılır. Bilerek "use server" DEĞİL:
// o direktif altındaki her export public bir endpoint haline gelir ve
// okuma fonksiyonlarını gereksiz yere dışarıya açardı.
// ==========================================

export async function getRoutines(): Promise<Routine[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("routines")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Routine[];
}

export async function getWeeklyVolume(): Promise<number> {
  const user = await requireUser();
  const supabase = await createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("total_volume")
    .eq("user_id", user.id)
    .gte("start_time", sevenDaysAgo.toISOString())
    .not("end_time", "is", null);

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (Number(row.total_volume) || 0), 0);
}

export async function getRoutineExercises(
  routineId: string
): Promise<RoutineExercise[]> {
  const user = await requireUser();
  const supabase = await createClient();

  // Rutin sahipliğini doğrulamadan egzersizleri döndürmüyoruz.
  const { data: routine } = await supabase
    .from("routines")
    .select("id")
    .eq("id", routineId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!routine) return [];

  const { data, error } = await supabase
    .from("routine_exercises")
    .select("*")
    .eq("routine_id", routineId)
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as RoutineExercise[];
}

export async function getWorkoutHistory(): Promise<WorkoutSession[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, routine_name, total_volume, start_time, end_time")
    .eq("user_id", user.id)
    .not("end_time", "is", null)
    .order("end_time", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as WorkoutSession[];
}

export async function getSessionSummary(
  sessionId: string
): Promise<WorkoutSession | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("workout_sessions")
    .select("id, routine_name, total_volume, start_time, end_time")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as WorkoutSession | null) ?? null;
}

/**
 * Kullanıcının TÜM tamamlanmış antrenmanlarından egzersiz bazında performans
 * geçmişi döndürür. Sonuç normalize edilmiş egzersiz adına göre gruplanır ve
 * her grup en yeniden en eskiye sıralıdır.
 *
 * Geçmiş bilerek rutinle sınırlanmıyor: aynı hareketi farklı programlarda
 * yapmak ilerlemeyi sıfırlamamalı. "Push" rutinindeki bench press ile "Üst
 * Vücut" rutinindeki bench press aynı harekettir.
 */
export async function getExerciseHistory(
  sessionLimit = 30,
  perExerciseLimit = 5
): Promise<Record<string, ExercisePerformance[]>> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, end_time")
    .eq("user_id", user.id)
    .not("end_time", "is", null)
    .order("end_time", { ascending: false })
    .limit(sessionLimit);

  if (!sessions || sessions.length === 0) return {};

  const sessionIds = sessions.map((s) => s.id as string);
  const endTimes = new Map(sessions.map((s) => [s.id as string, s.end_time as string]));
  const order = new Map(sessionIds.map((id, i) => [id, i]));

  const { data: logs } = await supabase
    .from("set_logs")
    .select("session_id, exercise_name, weight, reps")
    .in("session_id", sessionIds);

  if (!logs || logs.length === 0) return {};

  // Normalize edilmiş ad -> seans id -> performans
  const grouped = new Map<string, Map<string, ExercisePerformance>>();

  for (const log of logs) {
    const key = normalizeExerciseName(log.exercise_name as string);
    const sessionId = log.session_id as string;

    let bySession = grouped.get(key);
    if (!bySession) {
      bySession = new Map();
      grouped.set(key, bySession);
    }

    let entry = bySession.get(sessionId);
    if (!entry) {
      entry = {
        sessionId,
        performedAt: endTimes.get(sessionId) ?? "",
        sets: [],
      };
      bySession.set(sessionId, entry);
    }

    entry.sets.push({ weight: Number(log.weight), reps: Number(log.reps) });
  }

  const result: Record<string, ExercisePerformance[]> = {};
  for (const [key, bySession] of grouped) {
    result[key] = [...bySession.values()]
      .sort((a, b) => (order.get(a.sessionId) ?? 0) - (order.get(b.sessionId) ?? 0))
      .slice(0, perExerciseLimit);
  }

  return result;
}

/** Kullanıcının rutinlerinde geçen benzersiz egzersiz adları. */
export async function getUserExerciseNames(): Promise<string[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("routine_exercises")
    .select("exercise_name, routines!inner(user_id)")
    .eq("routines.user_id", user.id);

  if (!data) return [];

  // Aynı hareket birden fazla rutinde olabilir; kanonik yazımı koruyarak tekilleştiriyoruz.
  const byKey = new Map<string, string>();
  for (const row of data) {
    const name = row.exercise_name as string;
    const key = normalizeExerciseName(name);
    if (!byKey.has(key)) byKey.set(key, name);
  }

  return [...byKey.values()];
}

/** Süresi dolmamış ayarlamalar, egzersiz anahtarına göre. */
export async function getActiveAdjustments(): Promise<Record<string, Adjustment>> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("exercise_adjustments")
    .select("exercise_key, exercise_name, action, substitute_name, reason, expires_at")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString());

  if (!data) return {};

  return Object.fromEntries(
    data.map((row) => [
      row.exercise_key as string,
      {
        exerciseKey: row.exercise_key as string,
        exerciseName: row.exercise_name as string,
        action: row.action as Adjustment["action"],
        substituteName: (row.substitute_name as string | null) ?? null,
        reason: row.reason as string,
        expiresAt: row.expires_at as string,
      } satisfies Adjustment,
    ])
  );
}

/** Kullanıcının kendi eklediği, sınıflandırılmış hareketler. */
export async function getCustomExercises(): Promise<CustomExercise[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("custom_exercises")
    .select("exercise_key, exercise_name, muscle_group, exercise_type, min_step")
    .eq("user_id", user.id);

  if (!data) return [];

  return data.map((row) => ({
    exerciseKey: row.exercise_key as string,
    name: row.exercise_name as string,
    group: row.muscle_group as CustomExercise["group"],
    type: row.exercise_type as CustomExercise["type"],
    minStep: Number(row.min_step),
  }));
}

/** Katalog + kullanıcı hareketlerini birleştiren çözümleyici. */
export async function getExerciseResolver(): Promise<ExerciseResolver> {
  return createResolver(await getCustomExercises());
}

export interface ExerciseSummary {
  name: string;
  /** En son kullanılan çalışma ağırlığı. */
  lastWeight: number;
  /** Bugüne kadarki en ağır çalışma seti. */
  bestWeight: number;
  /** Bu hareketin yapıldığı seans sayısı (son 30 seans içinde). */
  sessionCount: number;
  /** En son ne zaman yapıldı (ISO). */
  lastPerformed: string;
}

export interface TrainingSummary {
  thisWeek: { sessions: number; volume: number };
  lastWeek: { sessions: number; volume: number };
  totalSessions: number;
  exercises: ExerciseSummary[];
}

/**
 * Koçun kullanıcının antrenmanı hakkında soru cevaplayabilmesi için derlenmiş
 * özet. Bilerek kompakt: her set değil, hareket başına tek satır.
 *
 * Sayılar burada hesaplanıyor, modelde değil. Modele hazır rakam veriyoruz ve
 * "hesaplama yapma, sadece verilenleri kullan" diyoruz; aksi halde uydurabilir.
 */
export async function getTrainingSummary(): Promise<TrainingSummary> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, end_time, total_volume")
    .eq("user_id", user.id)
    .not("end_time", "is", null)
    .order("end_time", { ascending: false })
    .limit(30);

  const empty: TrainingSummary = {
    thisWeek: { sessions: 0, volume: 0 },
    lastWeek: { sessions: 0, volume: 0 },
    totalSessions: 0,
    exercises: [],
  };

  if (!sessions || sessions.length === 0) return empty;

  const now = Date.now();
  const DAY = 86_400_000;

  const bucket = (from: number, to: number) => {
    const rows = sessions.filter((s) => {
      const t = new Date(s.end_time as string).getTime();
      return t > now - from && t <= now - to;
    });
    return {
      sessions: rows.length,
      volume: Math.round(
        rows.reduce((sum, r) => sum + (Number(r.total_volume) || 0), 0)
      ),
    };
  };

  const sessionIds = sessions.map((s) => s.id as string);
  const endTimes = new Map(sessions.map((s) => [s.id as string, s.end_time as string]));

  const { data: logs } = await supabase
    .from("set_logs")
    .select("session_id, exercise_name, weight")
    .in("session_id", sessionIds);

  const byExercise = new Map<string, ExerciseSummary>();

  if (logs) {
    // Seanslar en yeniden eskiye sıralı; ilk görülen kayıt en günceli.
    const order = new Map(sessionIds.map((id, i) => [id, i]));
    const sorted = [...logs].sort(
      (a, b) =>
        (order.get(a.session_id as string) ?? 0) -
        (order.get(b.session_id as string) ?? 0)
    );

    const seenSessions = new Map<string, Set<string>>();

    for (const log of sorted) {
      const name = log.exercise_name as string;
      const key = normalizeExerciseName(name);
      const weight = Number(log.weight) || 0;
      const sessionId = log.session_id as string;

      const entry = byExercise.get(key);
      if (!entry) {
        byExercise.set(key, {
          name,
          lastWeight: weight,
          bestWeight: weight,
          sessionCount: 1,
          lastPerformed: endTimes.get(sessionId) ?? "",
        });
        seenSessions.set(key, new Set([sessionId]));
        continue;
      }

      entry.bestWeight = Math.max(entry.bestWeight, weight);

      const seen = seenSessions.get(key)!;
      if (!seen.has(sessionId)) {
        seen.add(sessionId);
        entry.sessionCount += 1;
      } else {
        // Aynı seansın içindeyiz: en ağır set çalışma ağırlığıdır.
        entry.lastWeight = Math.max(entry.lastWeight, weight);
      }
    }
  }

  return {
    thisWeek: bucket(7 * DAY, 0),
    lastWeek: bucket(14 * DAY, 7 * DAY),
    totalSessions: sessions.length,
    exercises: [...byExercise.values()].sort((a, b) => b.sessionCount - a.sessionCount),
  };
}

/** Tek bir rutin; sahiplik doğrulanır, başkasınınki null döner. */
export async function getRoutine(routineId: string): Promise<Routine | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("routines")
    .select("id, name, created_at")
    .eq("id", routineId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as Routine | null) ?? null;
}

export interface OpenSession {
  sessionId: string;
  startedAt: string;
  /** Normalize edilmiş hareket adı -> o seansta kaydedilmiş set sayısı. */
  setCounts: Record<string, number>;
}

/**
 * Bu rutin için yarım kalmış (bitirilmemiş) bir antrenman var mı?
 *
 * Uygulama arkadan kapatıldığında, telefon kapandığında veya sekme
 * kapatıldığında seans end_time = null olarak kalıyordu. Geçmiş, haftalık
 * hacim ve ilerleme motoru bitmemiş seansları filtrelediği için o antrenman
 * hiç yapılmamış sayılıyordu — kaydedilen setler dahil.
 *
 * @param maxAgeHours Bundan eski seanslar "devam edilebilir" sayılmaz;
 *   dünkü yarım antrenmana bugün devam etmek yanlış olur.
 */
export async function getOpenSession(
  routineId: string,
  maxAgeHours = 6
): Promise<OpenSession | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const since = new Date(Date.now() - maxAgeHours * 3_600_000).toISOString();

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, start_time")
    .eq("user_id", user.id)
    .eq("routine_id", routineId)
    .is("end_time", null)
    .gte("start_time", since)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) return null;

  const { data: logs } = await supabase
    .from("set_logs")
    .select("exercise_name")
    .eq("session_id", session.id as string);

  const setCounts: Record<string, number> = {};
  for (const log of logs ?? []) {
    const key = normalizeExerciseName(log.exercise_name as string);
    setCounts[key] = (setCounts[key] ?? 0) + 1;
  }

  return {
    sessionId: session.id as string,
    startedAt: session.start_time as string,
    setCounts,
  };
}
