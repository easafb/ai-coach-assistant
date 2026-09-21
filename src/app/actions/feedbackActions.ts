"use server";

import { getSessionUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

type FeedbackKind = "feedback" | "error";

async function record(
  kind: FeedbackKind,
  message: string,
  context: Record<string, unknown>
): Promise<ActionResult> {
  // requireUser değil getSessionUser: hata raporu oturum düşmüşken de
  // gelebilir ve o durumda kullanıcıyı giriş ekranına fırlatmak istemiyoruz.
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const trimmed = message.trim().slice(0, 2000);
  if (!trimmed) return { ok: false, error: "Mesaj boş olamaz." };

  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    kind,
    message: trimmed,
    context,
  });

  if (error) {
    console.error("[feedback]", error.message);
    return { ok: false, error: "Gönderilemedi. Lütfen tekrar dene." };
  }

  return { ok: true, data: null };
}

/** Kullanıcının uygulamadan bildirdiği sorun veya öneri. */
export async function submitFeedbackAction(
  message: string,
  pathname: string
): Promise<ActionResult> {
  return record("feedback", message, { pathname });
}

/** İstemci tarafında yakalanan hata. Kullanıcı bir şey yapmadan gönderilir. */
export async function reportClientErrorAction(
  message: string,
  context: { pathname?: string; digest?: string; stack?: string }
): Promise<ActionResult> {
  return record("error", message, {
    ...context,
    stack: context.stack?.slice(0, 4000),
  });
}
