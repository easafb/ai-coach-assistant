"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { findTemplate } from "@/lib/templates";
import { validateAdjustments, type Adjustment } from "@/lib/adjustments";
import {
  getUserExerciseNames,
  getExerciseResolver,
  RESUME_WINDOW_HOURS,
} from "@/lib/queries";
import { normalizeExerciseName } from "@/lib/progression";
import type { MuscleGroup, ExerciseType } from "@/lib/exercises";
import type { ActionResult, ExerciseDraft } from "@/types";

const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
const fail = (error: string): ActionResult<never> => ({ ok: false, error });

/**
 * Veritabanı hatalarını kullanıcıya olduğu gibi göstermiyoruz.
 * "invalid input syntax for type integer" gibi mesajlar kullanıcı için
 * anlamsız, üstelik şema detayını dışarı sızdırıyor. Gerçek hata sunucu
 * loguna düşer; kullanıcı anlaşılır bir mesaj görür.
 */
function dbFail(context: string, error: { message: string }): ActionResult<never> {
  console.error(`[${context}]`, error.message);
  return { ok: false, error: "İşlem tamamlanamadı. Lütfen tekrar dene." };
}

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

  const cleaned = cleanExercises(exercises);
  if (cleaned.length === 0) return fail("En az bir egzersiz eklemelisin.");

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert([{ user_id: user.id, name: trimmedName }])
    .select("id")
    .single();

  if (routineError || !routine) {
    return routineError
      ? dbFail("createRoutine", routineError)
      : fail("Rutin oluşturulamadı.");
  }

  const { error: exerciseError } = await supabase
    .from("routine_exercises")
    .insert(exerciseRows(routine.id as string, cleaned));

  if (exerciseError) {
    // Alt egzersizler yazılamadıysa yarım rutin bırakmıyoruz.
    await supabase.from("routines").delete().eq("id", routine.id).eq("user_id", user.id);
    return dbFail("createRoutine.exercises", exerciseError);
  }

  revalidatePath("/dashboard");
  return ok({ routineId: routine.id as string });
}

/** İstemciden gelen egzersizleri sınırlara çeker ve boş olanları eler. */
function cleanExercises(exercises: ExerciseDraft[]) {
  return exercises
    .map((ex) => {
      const minReps = Math.max(1, Math.min(100, Math.trunc(ex.minReps) || 1));
      // Üst uç alt ucun altına düşemez.
      const maxReps = Math.max(minReps, Math.min(100, Math.trunc(ex.maxReps) || minReps));
      return {
        name: ex.name.trim(),
        sets: Math.max(1, Math.min(20, Math.trunc(ex.sets) || 0)),
        minReps,
        maxReps,
      };
    })
    .filter((ex) => ex.name.length > 0);
}

/** routine_exercises satırlarını hazırlar. */
function exerciseRows(routineId: string, cleaned: ReturnType<typeof cleanExercises>) {
  return cleaned.map((ex, index) => ({
    routine_id: routineId,
    exercise_name: ex.name,
    default_sets: ex.sets,
    min_reps: ex.minReps,
    max_reps: ex.maxReps,
    // default_reps artık okunmuyor (007 ile min_reps/max_reps geldi) ama
    // kolon eski şemadan kalma ve NOT NULL olabilir. Doldurmaya devam
    // ediyoruz: aksi halde rutin yazma sessizce patlar.
    default_reps: ex.minReps,
    order_index: index,
  }));
}

// ==========================================
// Rutin güncelleme
// ==========================================
export async function updateRoutineAction(
  routineId: string,
  name: string,
  exercises: ExerciseDraft[]
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const trimmedName = name.trim();
  if (!trimmedName) return fail("Rutin adı boş olamaz.");

  const cleaned = cleanExercises(exercises);
  if (cleaned.length === 0) return fail("En az bir egzersiz eklemelisin.");

  // Sahiplik doğrulaması: update'in user_id filtresi olsa da, egzersizleri
  // silmeden önce rutinin gerçekten bu kullanıcıya ait olduğundan emin oluyoruz.
  const { data: owned, error: ownerError } = await supabase
    .from("routines")
    .update({ name: trimmedName })
    .eq("id", routineId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (ownerError) return dbFail("updateRoutine.name", ownerError);
  if (!owned) return fail("Bu rutine erişim yetkin yok.");

  // Egzersizleri sil-yeniden yaz. Hiçbir tablo routine_exercises'a yabancı
  // anahtarla bağlı değil ve geçmiş set_logs'ta hareket ADIYLA tutuluyor,
  // dolayısıyla bu işlem geçmişi etkilemiyor.
  const { error: deleteError } = await supabase
    .from("routine_exercises")
    .delete()
    .eq("routine_id", routineId);

  if (deleteError) return dbFail("updateRoutine.clear", deleteError);

  const { error: insertError } = await supabase
    .from("routine_exercises")
    .insert(exerciseRows(routineId, cleaned));

  if (insertError) return dbFail("updateRoutine.insert", insertError);

  revalidatePath("/dashboard");
  revalidatePath(`/workout/${routineId}`);
  return ok(null);
}

// ==========================================
// Antrenman oturumu başlatma
// ==========================================
/**
 * Antrenman oturumu başlatır veya yarım kalmışa devam eder.
 *
 * Uygulama arkadan kapatıldığında seans end_time = null olarak kalıyordu ve
 * geçmiş, hacim ve ilerleme motoru bitmemiş seansları filtrelediği için o
 * antrenman -kaydedilen setler dahil- hiç yapılmamış sayılıyordu.
 */
export async function startWorkoutAction(
  routineId: string
): Promise<ActionResult<{ sessionId: string; resumed: boolean }>> {
  const user = await requireUser();
  const supabase = await createClient();

  // Rutin adını istemciden almıyoruz; sahibi doğrulanmış kaydın adını kullanıyoruz.
  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .select("name")
    .eq("id", routineId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (routineError) return dbFail("startWorkout.lookup", routineError);
  if (!routine) return fail("Rutin bulunamadı.");

  const { data: open } = await supabase
    .from("workout_sessions")
    .select("id, start_time")
    .eq("user_id", user.id)
    .eq("routine_id", routineId)
    .is("end_time", null)
    .order("start_time", { ascending: false });

  const cutoff = Date.now() - RESUME_WINDOW_HOURS * 3_600_000;
  const resumable = (open ?? []).find(
    (s) => new Date(s.start_time as string).getTime() >= cutoff
  );

  // Devam edilemeyecek kadar eskimiş seansları burada kapatıyoruz. Aksi halde
  // sonsuza kadar açık kalır ve içlerindeki setler hiçbir yerde görünmez.
  const stale = (open ?? []).filter((s) => s.id !== resumable?.id);
  for (const session of stale) {
    await closeSession(session.id as string, user.id);
  }

  if (resumable) {
    return ok({ sessionId: resumable.id as string, resumed: true });
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert([{ user_id: user.id, routine_id: routineId, routine_name: routine.name }])
    .select("id")
    .single();

  if (error) return dbFail("startWorkout.insert", error);
  if (!data) return fail("Antrenman başlatılamadı.");
  return ok({ sessionId: data.id as string, resumed: false });
}

/**
 * Bir seansı kapatır ve hacmini kaydedilmiş setlerden hesaplar.
 * finishWorkoutAction ile aynı mantık; terk edilmiş seansları kapatmak için
 * de kullanılıyor.
 */
async function closeSession(sessionId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { data: sets } = await supabase
    .from("set_logs")
    .select("weight, reps")
    .eq("session_id", sessionId);

  const raw = (sets ?? []).reduce(
    (sum, set) => sum + Number(set.weight ?? 0) * Number(set.reps ?? 0),
    0
  );

  await supabase
    .from("workout_sessions")
    .update({
      end_time: new Date().toISOString(),
      total_volume: Math.round(raw * 100) / 100,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);
}

// ==========================================
// Set kaydı
// ==========================================
export async function logSetAction(
  sessionId: string,
  exerciseName: string,
  weight: number,
  reps: number,
  /**
   * İstemcide üretilen benzersiz kimlik. Çevrimdışı kuyruk aynı seti tekrar
   * gönderebilir (cevap dönerken bağlantı koparsa); bu kimlik sayesinde
   * ikinci gönderim çift kayıt yaratmıyor.
   */
  clientId?: string,
  /**
   * Motorun bu set için ne önerdiği. Kullanıcının girdiğiyle birlikte
   * saklanıyor ki UYUM ORANI hesaplanabilsin — motorun doğru çalışıp
   * çalışmadığının tek ölçülebilir göstergesi bu.
   */
  prescription?: {
    weight: number | null;
    reps: number;
    decision: string;
    adjustmentAction: string | null;
    adjustmentReason: string | null;
  }
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
  const { error } = await supabase.from("set_logs").insert([
    {
      session_id: sessionId,
      exercise_name: exerciseName,
      weight,
      reps,
      client_id: clientId ?? null,
      prescribed_weight: prescription?.weight ?? null,
      prescribed_reps: prescription?.reps ?? null,
      decision: prescription?.decision ?? null,
      adjustment_action: prescription?.adjustmentAction ?? null,
      adjustment_reason: prescription?.adjustmentReason ?? null,
    },
  ]);

  // 23505 = benzersizlik ihlali. Bu set zaten kaydedilmiş demektir; tekrar
  // gönderim başarılı sayılıyor ki kuyruk sonsuza kadar denemesin.
  if (error && error.code === "23505") return ok(null);
  if (error) return dbFail("logSet", error);
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

  if (setsError) return dbFail("finishWorkout.sets", setsError);

  // Kayan nokta gürültüsü birikmesin diye iki ondalığa sabitliyoruz.
  const rawVolume = (sets ?? []).reduce(
    (sum, set) => sum + Number(set.weight ?? 0) * Number(set.reps ?? 0),
    0
  );
  const totalVolume = Math.round(rawVolume * 100) / 100;

  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ end_time: new Date().toISOString(), total_volume: totalVolume })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return dbFail("finishWorkout.update", error);
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

  if (error) return dbFail("deleteRoutine", error);

  revalidatePath("/dashboard");
  return ok(null);
}

// ==========================================
// Şablondan program oluşturma
// Şablon kullanıcının hesabına kopyalanır; sonrasında sahibi odur ve
// istediği gibi düzenleyebilir.
// ==========================================
export async function createRoutinesFromTemplateAction(
  templateId: string
): Promise<ActionResult<{ created: number }>> {
  const user = await requireUser();

  const template = findTemplate(templateId);
  if (!template) return fail("Şablon bulunamadı.");

  const supabase = await createClient();

  const { data: routines, error: routineError } = await supabase
    .from("routines")
    .insert(template.routines.map((routine) => ({ user_id: user.id, name: routine.name })))
    .select("id, name");

  if (routineError || !routines) {
    return routineError
      ? dbFail("createFromTemplate", routineError)
      : fail("Program oluşturulamadı.");
  }

  // Dönen satırların sırasına güvenmiyoruz; ada göre eşliyoruz.
  const idByName = new Map(routines.map((row) => [row.name as string, row.id as string]));

  const exerciseRows = template.routines.flatMap((routine) => {
    const routineId = idByName.get(routine.name);
    if (!routineId) return [];
    return routine.exercises.map((exercise, index) => ({
      routine_id: routineId,
      exercise_name: exercise.name,
      default_sets: exercise.sets,
      min_reps: exercise.minReps,
      max_reps: exercise.maxReps,
      // Bkz. createRoutineAction: eski şemadan kalan kolon, NOT NULL olabilir.
      default_reps: exercise.minReps,
      order_index: index,
    }));
  });

  const { error: exerciseError } = await supabase
    .from("routine_exercises")
    .insert(exerciseRows);

  if (exerciseError) {
    // Yarım program bırakmıyoruz.
    await supabase
      .from("routines")
      .delete()
      .in("id", [...idByName.values()])
      .eq("user_id", user.id);
    return dbFail("createFromTemplate.exercises", exerciseError);
  }

  revalidatePath("/dashboard");
  return ok({ created: routines.length });
}

// ==========================================
// Ayarlamalar
// ==========================================

/**
 * AI'ın önerdiği ayarlamaları kaydeder.
 * Öneriler buraya gelmeden önce validateAdjustments'tan geçmiş olmalıdır;
 * burada ikinci kez doğrulanırlar çünkü bu bir public endpoint.
 */
export async function saveAdjustmentsAction(
  adjustments: Adjustment[]
): Promise<ActionResult<{ saved: number }>> {
  const user = await requireUser();

  if (adjustments.length === 0) return ok({ saved: 0 });
  if (adjustments.length > 20) return fail("Çok fazla ayarlama.");

  // İstemciden gelen veriye güvenmiyoruz: kullanıcının gerçek egzersizlerine
  // ve katalog kas gruplarına karşı yeniden doğruluyoruz.
  const [userExercises, resolve] = await Promise.all([
    getUserExerciseNames(),
    getExerciseResolver(),
  ]);
  const validated = validateAdjustments(
    adjustments.map((a) => ({
      exercise: a.exerciseName,
      action: a.action,
      substitute: a.substituteName ?? undefined,
      reason: a.reason,
    })),
    userExercises,
    resolve
  );

  if (validated.length === 0) return fail("Geçerli bir ayarlama bulunamadı.");

  const supabase = await createClient();
  const { error } = await supabase.from("exercise_adjustments").upsert(
    validated.map((a) => ({
      user_id: user.id,
      exercise_key: a.exerciseKey,
      exercise_name: a.exerciseName,
      action: a.action,
      substitute_name: a.substituteName,
      reason: a.reason,
      expires_at: a.expiresAt,
    })),
    { onConflict: "user_id,exercise_key" }
  );

  if (error) return dbFail("saveAdjustments", error);

  revalidatePath("/dashboard");
  revalidatePath("/coach");
  return ok({ saved: validated.length });
}

/** Tek bir ayarlamayı kaldırır. Kullanıcı kontrolü her zaman AI'ın üstünde. */
export async function dismissAdjustmentAction(
  exerciseKey: string
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("exercise_adjustments")
    .delete()
    .eq("user_id", user.id)
    .eq("exercise_key", exerciseKey);

  if (error) return dbFail("dismissAdjustment", error);

  revalidatePath("/dashboard");
  revalidatePath("/coach");
  return ok(null);
}

// ==========================================
// Kullanıcıya özel egzersiz
// ==========================================

const MUSCLE_GROUPS: MuscleGroup[] = ["göğüs", "sırt", "omuz", "kol", "bacak", "karın"];
const EXERCISE_TYPES: ExerciseType[] = ["compound", "isolation"];
const ALLOWED_STEPS = [1.25, 2.5, 5];

/**
 * Katalogda olmayan bir hareketi sınıflandırarak kullanıcının kişisel
 * kataloğuna ekler. Sınıflandırma zorunlu: kas grubu bilinmeyen hareket
 * doğru artış adımı alamıyor ve AI ona ikame öneremiyor.
 */
export async function createCustomExerciseAction(
  name: string,
  group: string,
  type: string,
  minStep: number
): Promise<ActionResult<{ name: string }>> {
  const user = await requireUser();

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 60) {
    return fail("Hareket adı 2-60 karakter olmalı.");
  }
  if (!MUSCLE_GROUPS.includes(group as MuscleGroup)) {
    return fail("Geçersiz kas grubu.");
  }
  if (!EXERCISE_TYPES.includes(type as ExerciseType)) {
    return fail("Geçersiz hareket tipi.");
  }
  if (!ALLOWED_STEPS.includes(minStep)) {
    return fail("Geçersiz artış adımı.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("custom_exercises").upsert(
    {
      user_id: user.id,
      exercise_key: normalizeExerciseName(trimmed),
      exercise_name: trimmed,
      muscle_group: group,
      exercise_type: type,
      min_step: minStep,
      // 005'ten kalan kolon; NOT NULL olabileceği için dolduruyoruz.
      increment: minStep,
    },
    { onConflict: "user_id,exercise_key" }
  );

  if (error) return dbFail("createCustomExercise", error);

  revalidatePath("/routines/new");
  revalidatePath("/dashboard");
  return ok({ name: trimmed });
}
