import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import type { Routine, RoutineExercise, WorkoutSession } from "@/types";
import { normalizeExerciseName, type ExercisePerformance } from "@/lib/progression";

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
