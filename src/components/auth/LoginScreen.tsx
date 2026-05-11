"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Dumbbell } from "lucide-react";

const LoginScreen = () => {
  // SSR paketiyle uyumlu browser client oluşturuyoruz
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-white dark:bg-[#000000] p-8 pb-16 text-white">
      {/* Top Section: Branding */}
      <div className="mt-24 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">
            Powered by Intelligence
          </span>
        </div>
        
        {/* Dumbbell ikonunu burada kullanarak o hatayı da siliyoruz */}
        <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/20 text-white">
                <Dumbbell size={32} />
            </div>
        </div>

        <h1 className="text-5xl font-black tracking-tighter text-[#1D1D1F] dark:text-white mb-4 italic">
          Coach.ai
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto leading-tight font-medium">
          The future of personal training, adjusted to you.
        </p>
      </div>

      {/* Bottom Section: Actions */}
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleGoogleLogin}
          className="group relative w-full flex items-center justify-center gap-3 bg-[#1D1D1F] dark:bg-white text-white dark:text-black font-bold py-5 rounded-[22px] transition-all active:scale-95 shadow-2xl shadow-black/10"
        >
          <span className="text-lg">Continue with Google</span>
          <div className="absolute inset-0 rounded-[22px] group-hover:bg-white/5 dark:group-hover:bg-black/5 transition-colors" />
        </button>
        
        <div className="flex items-center justify-center gap-2 py-4">
          <input 
            type="checkbox" 
            id="remember" 
            className="w-4 h-4 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500"
            defaultChecked 
          />
          <label htmlFor="remember" className="text-sm font-medium text-slate-500">
            Remember me
          </label>
        </div>

        <p className="text-[11px] text-center text-slate-400 px-10 leading-relaxed uppercase font-bold tracking-wider">
          Artvin Coruh x AGH University 🇵🇱
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;