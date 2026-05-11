"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// 1. Yeni Bir Antrenman Rutini Oluşturma
export async function createRoutineAction(name: string, exercises: { name: string, sets: number, reps: number }[]) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum açmanız gerekiyor.");

  const { data: routine, error: rError } = await supabase
    .from("routines")
    .insert([{ user_id: user.id, name }])
    .select()
    .single();

  if (rError) return { error: rError.message };

  const exerciseData = exercises.map((ex, index) => ({
    routine_id: routine.id,
    exercise_name: ex.name,
    default_sets: ex.sets,
    default_reps: ex.reps,
    order_index: index,
  }));

  const { error: exError } = await supabase.from("routine_exercises").insert(exerciseData);
  
  if (exError) return { error: exError.message };

  // DÜZELTME: Ana üssümüz artık dashboard olduğu için burayı güncelledik
  revalidatePath("/dashboard");
  return { success: true, routineId: routine.id };
}

// 2. Antrenman Oturumunu Başlatma
export async function startWorkoutAction(routineName: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Yetkisiz erişim.");

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert([{ user_id: user.id, routine_name: routineName }])
    .select()
    .single();

  if (error) return { error: error.message };
  return { session: data };
}

// 3. Set Kaydı Tutma
export async function logSetAction(sessionId: string, exerciseName: string, weight: number, reps: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { error } = await supabase
    .from("set_logs")
    .insert([{ session_id: sessionId, exercise_name: exerciseName, weight, reps }]);

  if (error) return { error: error.message };
  return { success: true };
}

// 4. Antrenmanı Bitirme ve Hacim Kaydetme
export async function finishWorkoutAction(sessionId: string, totalVolume: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { error } = await supabase
    .from("workout_sessions")
    .update({ 
      end_time: new Date().toISOString(),
      total_volume: totalVolume 
    })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  // DÜZELTME: İdman bitince anında Dashboard'un güncellenmesi için düzeltildi
  revalidatePath("/dashboard"); 
  return { success: true };
}

// 5. Kayıtlı Tüm Rutinleri Getir
export async function getRoutinesAction() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { routines: data };
}

// 6. Haftalık Toplam Hacmi Hesapla
export async function getWeeklyVolumeAction() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { volume: 0 };

  // Son 7 günün başlangıcını bul
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("total_volume")
    .eq("user_id", user.id)
    .gte("start_time", sevenDaysAgo.toISOString()) // DÜZELTME: Tablondaki sütun adıyla (start_time) eşleştirildi!
    .not("end_time", "is", null);

  if (error || !data) return { volume: 0 };

  const total = data.reduce((acc, curr) => acc + (Number(curr.total_volume) || 0), 0);
  return { volume: total };
}

// 7. Belirli Bir Rutinin Egzersizlerini Getir
export async function getRoutineExercisesAction(routineId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { data, error } = await supabase
    .from("routine_exercises")
    .select("*")
    .eq("routine_id", routineId)
    .order("order_index", { ascending: true });

  if (error) return { error: error.message };
  return { exercises: data };
}

// 8. İdman Geçmişini Getir
export async function getWorkoutHistoryAction() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session not found." };

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .not("end_time", "is", null)
    .order("end_time", { ascending: false });

  if (error) return { error: error.message };
  return { history: data };
}

// 9. AI Tavsiyesini Kaydet
export async function saveAIWorkout(advice: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "User not found" };

  // DÜZELTME: Sondaki yazım/format hatası toparlandı
  const { error } = await supabase
    .from("workouts")
    .insert([{ user_id: user.id, ai_advice: advice }]);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteRoutineAction(routineId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Rutini siliyoruz. 
  // NOT: Supabase'de Foreign Key ayarlarında "ON DELETE CASCADE" açıksa 
  // ona bağlı egzersizler otomatik silinir.
  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId)
    .eq("user_id", user.id); // Güvenlik: Sadece kendi rutinini silebilir

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}