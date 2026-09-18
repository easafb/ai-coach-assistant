"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import type { ActionResult, ExerciseDraft } from "@/types";

const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
const fail = (error: string): ActionResult<never> => ({ ok: false, error });

// Bir oturumun (session) gerçekten çağıran kullanıcıya ait olduğunu doğrular.
// RLS'e ek ikinci savunma hattı: tek bir eksik policy tüm veriyi açmasın.
async function assertSessionOwner(sessionId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
}

// ==========================================
// Rutin oluşturma
// ==========================================
export async function createRoutineAction(
  name: string,
  exercises: ExerciseDraft[]
): Promise<ActionResult<{ routineId: string }>> {
  const user = await requireUser();
  const supabase = await createClient();

  const trimmedName = name.trim();
  if (!trimmedName) return fail("Rutin adı boş olamaz.");

  const cleaned = exercises
    .map((ex) => ({
      name: ex.name.trim(),
      sets: Math.max(1, Math.min(20, Math.trunc(ex.sets) || 0)),
      reps: Math.max(1, Math.min(100, Math.trunc(ex.reps) || 0)),
    }))
    .filter((ex) => ex.name.length > 0);

  if (cleaned.length === 0) return fail("En az bir egzersiz eklemelisin.");

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert([{ user_id: user.id, name: trimmedName }])
    .select("id")
    .single();

  if (routineError || !routine) {
    return fail(routineError?.message ?? "Rutin oluşturulamadı.");
  }

  const { error: exerciseError } = await supabase.from("routine_exercises").insert(
    cleaned.map((ex, index) => ({
      routine_id: routine.id,
      exercise_name: ex.name,
      default_sets: ex.sets,
      default_reps: ex.reps,
      order_index: index,
    }))
  );

  if (exerciseError) {
    // Alt egzersizler yazılamadıysa yarım rutin bırakmıyoruz.
    await supabase.from("routines").delete().eq("id", routine.id).eq("user_id", user.id);
    return fail(exerciseError.message);
  }

  revalidatePath("/dashboard");
  return ok({ routineId: routine.id as string });
}

// ==========================================
// Antrenman oturumu başlatma
// ==========================================
export async function startWorkoutAction(
  routineId: string
): Promise<ActionResult<{ sessionId: string }>> {
  const user = await requireUser();
  const supabase = await createClient();

  // Rutin adını istemciden almıyoruz; sahibi doğrulanmış kaydın adını kullanıyoruz.
  // Eski kod sabit "Active Session" yazdığı için geçmiş ekranı hep aynı adı gösteriyordu.
  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .select("name")
    .eq("id", routineId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (routineError) return fail(routineError.message);
  if (!routine) return fail("Rutin bulunamadı.");

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert([{ user_id: user.id, routine_name: routine.name }])
    .select("id")
    .single();

  if (error || !data) return fail(error?.message ?? "Antrenman başlatılamadı.");
  return ok({ sessionId: data.id as string });
}

// ==========================================
// Set kaydı
// ==========================================
export async function logSetAction(
  sessionId: string,
  exerciseName: string,
  weight: number,
  reps: number
): Promise<ActionResult> {
  const user = await requireUser();

  if (!Number.isFinite(weight) || weight < 0 || weight > 1000) {
    return fail("Geçersiz ağırlık.");
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
    return fail("Geçersiz tekrar sayısı.");
  }
  if (!(await assertSessionOwner(sessionId, user.id))) {
    return fail("Bu antrenmana erişim yetkin yok.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("set_logs")
    .insert([{ session_id: sessionId, exercise_name: exerciseName, weight, reps }]);

  if (error) return fail(error.message);
  return ok(null);
}

// ==========================================
// Antrenmanı bitirme
// ==========================================
export async function finishWorkoutAction(sessionId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  // Hacmi istemciden almıyoruz; kaydedilmiş setlerden sunucuda hesaplıyoruz.
  // Aksi halde kullanıcı toplam hacmini istediği gibi şişirebilirdi.
  const { data: sets, error: setsError } = await supabase
    .from("set_logs")
    .select("weight, reps")
    .eq("session_id", sessionId);

  if (setsError) return fail(setsError.message);

  const totalVolume = (sets ?? []).reduce(
    (sum, set) => sum + Number(set.weight ?? 0) * Number(set.reps ?? 0),
    0
  );

  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ end_time: new Date().toISOString(), total_volume: totalVolume })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return fail("Bu antrenmana erişim yetkin yok.");

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return ok(null);
}

// ==========================================
// Rutin silme
// ==========================================
export async function deleteRoutineAction(routineId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId)
    .eq("user_id", user.id);

  if (error) return fail(error.message);

  revalidatePath("/dashboard");
  return ok(null);
}
