import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * AÇIK RIZA
 *
 * KVKK md. 6 sağlık verisinin işlenmesini, md. 9 yurt dışına aktarımı açık
 * rızaya bağlıyor. Uygulamada ikisi de yapılıyor: Koç'a yazılan ağrı
 * bildirimleri sağlık verisi, Supabase/Vercel/Google sunucuları yurt dışında.
 *
 * Rıza yalnızca alınmakla kalmıyor, KAYDEDİLİYOR ve SÜRÜMLENİYOR: kullanıcı
 * "onaylamadım" derse kanıt gerekiyor, metin değişince de yeniden onay.
 */

/**
 * Yürürlükteki aydınlatma metninin sürümü.
 * Metinde esaslı bir değişiklik olduğunda ARTIR: eski sürümü onaylamış
 * kullanıcılardan otomatik olarak yeniden onay istenir.
 */
export const CURRENT_POLICY_VERSION = 1;

export interface ConsentState {
  policyVersion: number;
  healthData: boolean;
  crossBorder: boolean;
}

export const getConsent = cache(async (userId: string): Promise<ConsentState | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_consents")
    .select("policy_version, health_data, cross_border")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return {
    policyVersion: data.policy_version as number,
    healthData: data.health_data as boolean,
    crossBorder: data.cross_border as boolean,
  };
});

/** Rıza güncel ve eksiksiz mi? */
export function isConsentValid(consent: ConsentState | null): boolean {
  return (
    consent !== null &&
    consent.policyVersion >= CURRENT_POLICY_VERSION &&
    consent.healthData &&
    consent.crossBorder
  );
}
