"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  EXPERIENCES,
  GOALS,
  SOURCES,
  type Experience,
  type Goal,
  type Source,
} from "@/lib/survey";
import type { ActionResult } from "@/types";

/**
 * HESAP VE VERİ HAKLARI
 *
 * KVKK md. 11 ve GDPR md. 15/17 kullanıcıya verilerine erişme ve silinmesini
 * isteme hakkı veriyor. Bu dosya ikisinin de teknik karşılığı.
 */

/**
 * Kullanıcının tüm verisini tek bir JSON nesnesi olarak döndürür.
 * Sorgular RLS altında çalıştığı için yalnızca kendi satırları geliyor.
 */
export async function exportUserDataAction(): Promise<
  ActionResult<Record<string, unknown>>
> {
  const user = await requireUser();
  const supabase = await createClient();

  const [routines, exercises, sessions, sets, adjustments, customs, feedback, profile] =
    await Promise.all([
      supabase.from("routines").select("*").eq("user_id", user.id),
      supabase
        .from("routine_exercises")
        .select("*, routines!inner(user_id)")
        .eq("routines.user_id", user.id),
      supabase.from("workout_sessions").select("*").eq("user_id", user.id),
      supabase
        .from("set_logs")
        .select("*, workout_sessions!inner(user_id)")
        .eq("workout_sessions.user_id", user.id),
      supabase.from("exercise_adjustments").select("*").eq("user_id", user.id),
      supabase.from("custom_exercises").select("*").eq("user_id", user.id),
      supabase.from("feedback").select("*").eq("user_id", user.id),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

  // Rutin adlarını kimlik yerine isimle gösterebilmek için eşleme.
  const routineNames = new Map(
    (routines.data ?? []).map((r) => [r.id as string, r.name as string])
  );
  const sessionNames = new Map(
    (sessions.data ?? []).map((s) => [
      s.id as string,
      (s.routine_name as string) ?? "Antrenman",
    ])
  );

  /*
   * Çıktı kasıtlı olarak yeniden biçimlendiriliyor.
   * Ham satırlar üç sorun içeriyordu:
   *   - filtreleme için kullanılan join artıkları (routines: { user_id })
   *   - her satırda tekrar eden kullanıcı kimliği
   *   - artık okunmayan eski kolonlar (default_reps, increment)
   * KVKK kapsamında verilen çıktının kullanıcı için ANLAŞILIR olması gerekiyor;
   * veritabanı iç yapısını paylaşmak amaç değil.
   */
  return {
    ok: true,
    data: {
      disaAktarimTarihi: new Date().toISOString(),
      hesap: {
        eposta: user.email ?? null,
        kayitTarihi: user.created_at ?? null,
        saglayici: user.app_metadata?.provider ?? null,
      },
      programlarim: (routines.data ?? []).map((r) => ({
        ad: r.name,
        olusturulma: r.created_at,
        hareketler: (exercises.data ?? [])
          .filter((e) => e.routine_id === r.id)
          .sort((a, b) => (a.order_index as number) - (b.order_index as number))
          .map((e) => ({
            hareket: e.exercise_name,
            set: e.default_sets,
            tekrarAlt: e.min_reps,
            tekrarUst: e.max_reps,
          })),
      })),
      antrenmanlarim: (sessions.data ?? []).map((s) => ({
        program: s.routine_name ?? null,
        baslangic: s.start_time,
        bitis: s.end_time,
        toplamHacimKg: s.total_volume === null ? null : Number(s.total_volume),
        tamamlandi: s.end_time !== null,
        setler: (sets.data ?? [])
          .filter((l) => l.session_id === s.id)
          .map((l) => ({
            hareket: l.exercise_name,
            agirlikKg: Number(l.weight),
            tekrar: l.reps,
            zaman: l.logged_at,
          })),
      })),
      programAyarlamalarim: (adjustments.data ?? []).map((a) => ({
        hareket: a.exercise_name,
        eylem: a.action,
        yerineGecen: a.substitute_name,
        gerekce: a.reason,
        olusturulma: a.created_at,
        gecerlilikSonu: a.expires_at,
      })),
      kendiHareketlerim: (customs.data ?? []).map((c) => ({
        hareket: c.exercise_name,
        kasGrubu: c.muscle_group,
        tip: c.exercise_type === "isolation" ? "izolasyon" : "bileşik",
        enKucukArtisKg: Number(c.min_step),
        olusturulma: c.created_at,
      })),
      anketCevaplarim: profile.data?.answered_at
        ? {
            hedef: GOALS[profile.data.goal as Goal] ?? null,
            deneyim: EXPERIENCES[profile.data.experience as Experience] ?? null,
            neredenDuydum: SOURCES[profile.data.source as Source] ?? null,
            tarih: profile.data.answered_at,
          }
        : null,
      geriBildirimlerim: (feedback.data ?? []).map((f) => ({
        tur: f.kind === "error" ? "otomatik hata raporu" : "geri bildirim",
        mesaj: f.message,
        tarih: f.created_at,
      })),
      // Kullanılmayan eşlemeler bilerek dışarıda; çıktıda iç kimlik yok.
      _not:
        `Bu dosya ${routineNames.size} program ve ${sessionNames.size} antrenman ` +
        "kaydı içeriyor. Kişisel verilerinle ilgili soruların için " +
        "easafb1907@gmail.com adresine yazabilirsin.",
    },
  };
}

/**
 * Hesabı ve TÜM verisini kalıcı olarak siler. Geri alınamaz.
 *
 * Silme işi veritabanındaki delete_own_account() fonksiyonunda yapılıyor:
 * auth.users satırını silmek yükseltilmiş yetki gerektiriyor ve o yetkiyi
 * istemciye vermek istemiyoruz. Fonksiyon hangi kullanıcıyı sileceğini
 * auth.uid() ile kendisi belirliyor, dışarıdan parametre almıyor.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_own_account");

  if (error) {
    console.error("[deleteAccount]", error.message);
    return { ok: false, error: "Hesap silinemedi. Lütfen tekrar dene." };
  }

  // Kimlik kaydı gittiği için oturum zaten geçersiz; çerezleri de temizliyoruz.
  await supabase.auth.signOut();
  return { ok: true, data: null };
}
