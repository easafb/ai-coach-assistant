import "server-only";

import { getSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * HUNİ OLAYLARI
 *
 * Kullanıcının nerede düştüğü ölçülemiyordu. Ayrı analitik aracı kurmak
 * yerine tek tablo: veri kendi veritabanımızda kalıyor, sorgular SQL.
 *
 * TASARIM: track() ASLA hata fırlatmaz ve akışı bloklamaz. Ölçüm, ölçtüğü
 * şeyi bozmamalı — bir olay kaydedilemediği için kullanıcının antrenmanı
 * yarıda kalmamalı.
 */
export type EventName =
  | "signup_completed"
  | "routine_created"
  | "workout_started"
  | "workout_resumed"
  | "workout_completed"
  | "workout_abandoned"
  | "coach_opened"
  | "coach_message_sent"
  | "adjustment_applied"
  | "survey_answered"
  | "survey_dismissed";

export async function track(
  name: EventName,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // requireUser değil: olay kaydı hiçbir koşulda yönlendirme tetiklememeli.
    const user = await getSessionUser();
    if (!user) return;

    const supabase = await createClient();
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      name,
      metadata: metadata ?? null,
    });

    if (error) console.error(`[events:${name}]`, error.message);
  } catch (error) {
    console.error(
      `[events:${name}]`,
      error instanceof Error ? error.message : error
    );
  }
}
