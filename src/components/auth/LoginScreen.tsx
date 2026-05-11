"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Dumbbell } from "lucide-react";

const LoginScreen = () => {
  // Projenin geri kalanıyla uyumlu browser client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Canlıda Vercel linkine, lokalde localhost'a otomatik yönlendirir
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-[#000000] p-8 pb-16 text-white">
      <div className="mt-24 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">
            Powered by Intelligence
          </span>
        </div>
        
        <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/20 text-white">
                <Dumbbell size={32} />
            </div>
        </div>

        <h1 className="text-5xl font-black tracking-tighter text-white mb-4 italic">
          Coach.ai
        </h1>
        <p className="text-lg text-slate-400 max-w-[250px] mx-auto leading-tight font-medium">
          The future of personal training, adjusted to you.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleGoogleLogin}
          className="group relative w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-5 rounded-[22px] transition-all active:scale-95 shadow-2xl shadow-white/5"
        >
          <span className="text-lg">Continue with Google</span>
          <div className="absolute inset-0 rounded-[22px] group-hover:bg-black/5 transition-colors" />
        </button>
        
        <div className="flex items-center justify-center gap-2 py-4">
          <input 
            type="checkbox" 
            id="remember" 
            className="w-4 h-4 rounded-full border-slate-700 bg-transparent text-blue-600"
            defaultChecked 
          />
          <label htmlFor="remember" className="text-sm font-medium text-slate-500">
            Remember me
          </label>
        </div>

        <p className="text-[11px] text-center text-slate-500 px-10 leading-relaxed uppercase font-bold tracking-wider">
          Artvin Coruh x AGH University 🇵🇱
        </p>
      </div>
    </div>
  );
};

// force deploy v1.0.0

export default LoginScreen;