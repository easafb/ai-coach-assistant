"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
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

  const [routines, exercises, sessions, sets, adjustments, customs, feedback] =
    await Promise.all([
      supabase.from("routines").select("*").eq("user_id", user.id),
      supabase.from("routine_exercises").select("*, routines!inner(user_id)").eq("routines.user_id", user.id),
      supabase.from("workout_sessions").select("*").eq("user_id", user.id),
      supabase.from("set_logs").select("*, workout_sessions!inner(user_id)").eq("workout_sessions.user_id", user.id),
      supabase.from("exercise_adjustments").select("*").eq("user_id", user.id),
      supabase.from("custom_exercises").select("*").eq("user_id", user.id),
      supabase.from("feedback").select("*").eq("user_id", user.id),
    ]);

  return {
    ok: true,
    data: {
      disaAktarimTarihi: new Date().toISOString(),
      hesap: {
        id: user.id,
        eposta: user.email ?? null,
        kayitTarihi: user.created_at ?? null,
        saglayici: user.app_metadata?.provider ?? null,
      },
      rutinler: routines.data ?? [],
      rutinEgzersizleri: exercises.data ?? [],
      antrenmanlar: sessions.data ?? [],
      setKayitlari: sets.data ?? [],
      programAyarlamalari: adjustments.data ?? [],
      kendiHareketlerim: customs.data ?? [],
      geriBildirimlerim: feedback.data ?? [],
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
