import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getConsent, isConsentValid } from "@/lib/consent";

// ==========================================
// DATA ACCESS LAYER
// Yetkilendirmenin tek kaynağı burasıdır. Veriye dokunan her Server Action ve
// Server Component önce buradan geçer; proxy.ts'teki kontrol yalnızca iyimser
// (optimistic) bir yönlendirmedir, güvenlik sınırı değildir.
// ==========================================

// cache() sayesinde tek bir render/action geçişinde getUser() ağ çağrısı
// kaç kez istenirse istensin yalnızca bir kez yapılır.
export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Oturum zorunlu olan her yerde bunu kullan. Oturum yoksa akışı kesip
// giriş ekranına yollar, dolayısıyla dönüş tipi asla null olmaz.
export const requireUser = cache(async (): Promise<User> => {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return user;
});

// Kullanıcıya gösterilecek ad. Google profilinden gelir, yoksa e-postaya düşer.
export function displayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const raw =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email ||
    "";
  return raw.split("@")[0].split(" ")[0] || "Sporcu";
}

/**
 * Oturum + güncel açık rıza zorunlu.
 *
 * Yurt dışına aktarım rızası (KVKK md. 9) tüm veri işlemeyi kapsıyor —
 * veritabanı yurt dışında. Bu yüzden rıza kontrolü yalnızca Koç'ta değil,
 * veriye dokunan her sayfada yapılıyor.
 *
 * Rızası olmayan veya metnin eski sürümünü onaylamış kullanıcılar onay
 * ekranına yönlendiriliyor. cache() sayesinde tek render'da tek sorgu.
 */
export const requireConsent = cache(async (): Promise<User> => {
  const user = await requireUser();
  const consent = await getConsent(user.id);
  if (!isConsentValid(consent)) redirect("/onay");
  return user;
});
