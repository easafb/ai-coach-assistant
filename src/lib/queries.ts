import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import type { Routine, RoutineExercise, WorkoutSession } from "@/types";

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
