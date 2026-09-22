"use server";

import { requireUser } from "@/lib/dal";
import { track } from "@/lib/events";
import { parseSurvey } from "@/lib/survey";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

/** Antrenman sonrası anketin cevabı. */
export async function submitSurveyAction(raw: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const answers = parseSurvey(raw);
  if (!answers) return { ok: false, error: "Lütfen üç soruyu da cevapla." };

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").upsert(
    { user_id: user.id, ...answers, answered_at: now, updated_at: now },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[survey.submit]", error.message);
    return { ok: false, error: "Kaydedilemedi. Lütfen tekrar dene." };
  }

  await track("survey_answered");
  return { ok: true, data: null };
}

/**
 * "Şimdi değil". Bir daha sorulmuyor: ısrar etmek, anketin kendisinden
 * daha çok kullanıcı kaybettirir.
 */
export async function dismissSurveyAction(): Promise<ActionResult> {
  const user = await requireUser();

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").upsert(
    { user_id: user.id, dismissed_at: now, updated_at: now },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[survey.dismiss]", error.message);
    return { ok: false, error: "Kaydedilemedi." };
  }

  await track("survey_dismissed");
  return { ok: true, data: null };
}
