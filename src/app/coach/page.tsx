import { Sparkles } from "lucide-react";

import { getActiveAdjustments } from "@/lib/queries";
import BottomNav from "@/components/navigation/BottomNav";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import CoachConsultation from "@/components/coach/CoachConsultation";
import ActiveAdjustments from "@/components/coach/ActiveAdjustments";

export default async function CoachPage() {
  const adjustments = Object.values(await getActiveAdjustments());

  return (
    <main className="min-h-dvh bg-[#050505] p-6 pb-[calc(8rem+env(safe-area-inset-bottom))] text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-10 pt-8">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={20} />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500">
              Yapay Zekâ Antrenör
            </span>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter">COACH.AI</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Nasıl hissettiğini anlat, programını buna göre değiştireyim.
          </p>
        </header>

        {adjustments.length > 0 && (
          <div className="mb-8">
            <ActiveAdjustments adjustments={adjustments} />
          </div>
        )}

        <CoachConsultation />
      </div>
      <FeedbackButton />
      <BottomNav />
    </main>
  );
}
