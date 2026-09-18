"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginScreen() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsRedirecting(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
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

        <button
          onClick={handleGoogleLogin}
          disabled={isRedirecting}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {isRedirecting ? "Yönlendiriliyor..." : "Google ile devam et"}
        </button>
      </div>
    </main>
  );
}
