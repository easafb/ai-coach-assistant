"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Check, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginScreen({ authFailed = false }: { authFailed?: boolean }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  // Callback kod takasında başarısız olursa buraya ?error=auth ile dönülüyor.
  // Eskiden bu parametre hiç okunmuyordu; kullanıcı neden giriş ekranına
  // geri düştüğünü anlamıyordu.
  const [error, setError] = useState<string | null>(
    authFailed ? "Giriş tamamlanamadı. Lütfen tekrar dene." : null
  );
  // KVKK md. 6 ve md. 9: sağlık verisi ve yurt dışına aktarım için ayrı
  // açık rıza gerekiyor. Aydınlatma metnini okuma beyanı bunların yerine
  // geçmiyor, o yüzden üç ayrı kutu değil — iki rıza + bir bilgilendirme.
  const [readPolicy, setReadPolicy] = useState(false);
  const [consent, setConsent] = useState(false);

  const canContinue = readPolicy && consent;

  /**
   * Apple girişi yalnızca Supabase'de sağlayıcı yapılandırıldığında
   * görünüyor. Yapılandırılmadan gösterilen buton hata sayfasına
   * götürürdü; beta testçilerine bozuk bir giriş yolu sunmuyoruz.
   *
   * Apple tarafı Developer Program üyeliği, Services ID ve .p8 anahtarı
   * gerektiriyor; bunlar tamamlandığında ortam değişkeni "true" yapılır.
   */
  const appleEnabled = process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === "true";

  const handleLogin = async (provider: "google" | "apple") => {
    if (!canContinue) return;
    setIsRedirecting(true);
    setError(null);

    // Rıza, OAuth dönüşünden sonra kullanıcı kimliğiyle birlikte kaydedilecek.
    // Google'a yönlendirme sırasında state kaybolduğu için çerezle taşıyoruz.
    document.cookie = `pending_consent=1; path=/; max-age=600; SameSite=Lax`;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });

    if (authError) {
      setError("Giriş başlatılamadı. Lütfen tekrar dene.");
      setIsRedirecting(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between bg-black p-8 pb-16 text-white">
      <div className="mt-24 text-center">
        <div className="mb-6 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
            Yapay zekâ destekli
          </span>
        </div>

        <div className="mb-4 flex justify-center">
          <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-900/20">
            <Dumbbell size={32} />
          </div>
        </div>

        <h1 className="mb-4 text-5xl font-black italic tracking-tighter">Coach.ai</h1>
        <p className="mx-auto max-w-xs text-sm font-medium text-neutral-500">
          Geçmiş antrenmanlarını okuyup bir sonraki seansını senin için planlayan
          dijital antrenör.
        </p>
      </div>

      <div className="w-full max-w-sm">
        {error && (
          <p role="alert" className="mb-4 text-center text-sm font-medium text-red-400">
            {error}
          </p>
        )}

        {/* Onaylar butondan ÖNCE: kullanıcı neyi kabul ettiğini görmeden
            giriş yapamasın. */}
        <div className="mb-5 space-y-3 text-left">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={readPolicy}
              onChange={(e) => setReadPolicy(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                readPolicy
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-white/20 bg-white/5"
              }`}
            >
              {readPolicy && <Check size={14} strokeWidth={3} />}
            </span>
            <span className="text-[13px] leading-snug text-neutral-400">
              <Link
                href="/gizlilik"
                className="font-semibold text-blue-400 underline"
                onClick={(e) => e.stopPropagation()}
              >
                Aydınlatma metnini
              </Link>{" "}
              okudum.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                consent
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-white/20 bg-white/5"
              }`}
            >
              {consent && <Check size={14} strokeWidth={3} />}
            </span>
            <span className="text-[13px] leading-snug text-neutral-400">
              Sağlık verilerimin işlenmesine ve yurt dışı sunucularına
              aktarılmasına <strong className="text-neutral-300">açık rıza</strong>{" "}
              gösteriyorum.
            </span>
          </label>
        </div>

        <button
          onClick={() => handleLogin("google")}
          disabled={isRedirecting || !canContinue}
          className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-8 font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {isRedirecting ? "Yönlendiriliyor..." : "Google ile devam et"}
        </button>

        {appleEnabled && (
          <button
            onClick={() => handleLogin("apple")}
            disabled={isRedirecting || !canContinue}
            className="mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-black px-8 font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isRedirecting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M17.05 12.04c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.41-.93-2.43-3.66zM14.77 4.9c.63-.77 1.06-1.83.94-2.9-.91.04-2.01.61-2.67 1.37-.59.68-1.1 1.77-.96 2.81 1.01.08 2.05-.51 2.69-1.28z" />
              </svg>
            )}
            {isRedirecting ? "Yönlendiriliyor..." : "Apple ile devam et"}
          </button>
        )}
      </div>
    </main>
  );
}
