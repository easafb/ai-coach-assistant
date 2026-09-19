import { Sparkles } from "lucide-react";

import BottomNav from "@/components/navigation/BottomNav";
import CoachConsultation from "@/components/coach/CoachConsultation";

export default function CoachPage() {
  return (
    <main className="min-h-dvh bg-[#050505] p-6 pb-[calc(8rem+env(safe-area-inset-bottom))] text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-12 pt-8">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={20} />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500">
              Yapay Zekâ Antrenör
            </span>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter">COACH.AI</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Bugün nasıl hissediyorsun? Durumuna göre antrenmanını birlikte ayarlayalım.
          </p>
        </header>

        <CoachConsultation />
      </div>
      <BottomNav />
    </main>
  );
}
