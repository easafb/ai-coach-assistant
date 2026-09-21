import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * KULLANIM LİMİTİ
 *
 * Koç uç noktasında hiçbir tavan yoktu. Normal kullanım ucuz ama sınırsızdı:
 * bir döngü hatası, betikle atılan istekler veya kötü niyetli tek kullanıcı
 * faturayı istediği kadar şişirebilirdi.
 *
 * İki katman: kullanıcı başına günlük kota ve tüm sistem için günlük tavan.
 * İkincisi devre kesici — birden fazla hesapla yapılan istismarı da durdurur.
 */

/** Kullanıcı başına günlük istek. Gerçek kullanımda kimse buna yaklaşmaz. */
export const DAILY_LIMIT_PER_USER = 25;

/** Tüm kullanıcılar toplamı. Beklenmedik bir patlamada devreyi keser. */
export const DAILY_LIMIT_GLOBAL = 1000;

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: "user" | "global" };

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = await createClient();
  const since = startOfTodayISO();

  const [userCount, globalCount] = await Promise.all([
    supabase
      .from("ai_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since),
    supabase
      .from("ai_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  // Sayım başarısız olursa isteği engellemiyoruz: kullanıcıyı sayaç hatası
  // yüzünden kilitlemek, limitin koruduğu maliyetten daha kötü bir sonuç.
  const used = userCount.count ?? 0;
  const total = globalCount.count ?? 0;

  if (used >= DAILY_LIMIT_PER_USER) return { allowed: false, reason: "user" };
  if (total >= DAILY_LIMIT_GLOBAL) return { allowed: false, reason: "global" };

  return { allowed: true, remaining: DAILY_LIMIT_PER_USER - used };
}

/** İsteği kaydeder. Maliyet analizi için token sayıları da saklanıyor. */
export async function recordAiRequest(
  userId: string,
  usage?: { promptTokens?: number; outputTokens?: number }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("ai_requests").insert({
    user_id: userId,
    prompt_tokens: usage?.promptTokens ?? null,
    output_tokens: usage?.outputTokens ?? null,
  });
  if (error) console.error("[ai_requests]", error.message);
}
