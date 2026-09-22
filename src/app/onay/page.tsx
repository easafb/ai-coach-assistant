import { redirect } from "next/navigation";

import { requireUser, displayName } from "@/lib/dal";
import { getConsent, isConsentValid } from "@/lib/consent";
import ConsentForm from "@/components/auth/ConsentForm";

/**
 * Açık rıza ekranı.
 *
 * Yeni kullanıcılar rızayı giriş ekranında veriyor. Burası iki durumu
 * yakalıyor: bu özellikten ÖNCE kaydolmuş kullanıcılar ve aydınlatma metni
 * güncellendiği için yeniden onay gereken kullanıcılar.
 */
export default async function ConsentPage() {
  const user = await requireUser();
  const consent = await getConsent(user.id);

  // Rızası zaten geçerliyse burada işi yok.
  if (isConsentValid(consent)) redirect("/dashboard");

  return <ConsentForm name={displayName(user)} isUpdate={consent !== null} />;
}
