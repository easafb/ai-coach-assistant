"use client";

import { useEffect } from "react";

/**
 * Antrenman sürerken ekranın sönmesini engeller.
 *
 * Salonda setler arasında telefon cebe giriyor ya da yere konuyor; ekran
 * sönünce kullanıcı her sette tekrar açıp uygulamaya dönmek zorunda kalıyor.
 * Wake Lock bunu ortadan kaldırıyor.
 *
 * Desteklenmeyen tarayıcılarda sessizce devre dışı kalıyor — bu bir kolaylık,
 * bir gereklilik değil. Kilit sekme arkaplana alınınca sistem tarafından
 * bırakılıyor, o yüzden geri dönüldüğünde yeniden isteniyor.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // Pil tasarrufu modunda veya izin verilmediğinde reddedilebilir.
        // Sessizce vazgeçiyoruz; antrenman akışını bozacak bir durum değil.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !cancelled) void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
