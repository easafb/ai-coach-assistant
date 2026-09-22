"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CURRENT_POLICY_VERSION } from "@/lib/consent";
import type { ActionResult } from "@/types";

/**
 * Kullanıcının açık rızasını kaydeder.
 *
 * İki onay da zorunlu: sağlık verisi işlenmesi olmadan Koç çalışamaz, yurt
 * dışına aktarım olmadan uygulama hiç çalışamaz (veritabanı orada).
 * Kısmi rıza kabul edilmiyor; kullanıcı onaylamazsa hesabını silebilir.
 */
export async function saveConsentAction(
  healthData: boolean,
  crossBorder: boolean
): Promise<ActionResult> {
  const user = await requireUser();

  if (!healthData || !crossBorder) {
    return { ok: false, error: "Devam etmek için her iki onayı da vermelisin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_consents").upsert(
    {
      user_id: user.id,
      policy_version: CURRENT_POLICY_VERSION,
      health_data: healthData,
      cross_border: crossBorder,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[saveConsent]", error.message);
    return { ok: false, error: "Onay kaydedilemedi. Lütfen tekrar dene." };
  }

  return { ok: true, data: null };
}
