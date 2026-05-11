"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import { generateAdjustedWorkout } from "@/services/aiService";
import { Trophy, Sparkles, ArrowRight, Activity, Zap } from "lucide-react";

export default function WorkoutSummary() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const volume = searchParams.get("volume");
  
  const [aiInsight, setAiInsight] = useState<string>("Analyzing your performance...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAIAdvice() {
      try {
        // currentWorkout bir Exercise[] dizisi beklediği için [] gönderiyoruz
        // Toplam hacmi (volume) userFeedback içinde Gemini'ye iletiyoruz
        const advice = await generateAdjustedWorkout({ 
          userLevel: "Intermediate",
          currentWorkout: [], 
          userFeedback: `I just finished my workout. My total volume was ${volume}kg. Give me a 1-sentence professional insight.`
        });
        
        if (advice && advice.aiAdjustmentNote) {
          setAiInsight(advice.aiAdjustmentNote);
        } else {
          setAiInsight("Great work on completing your session! Your consistency is paying off.");
        }

      } catch (error) {
        console.error("AI Service Error:", error);
        setAiInsight("Incredible effort today! Your consistency is your superpower. Focus on recovery tonight.");
      } finally {
        setLoading(false);
      }
    }

    if (volume) {
      getAIAdvice();
    }
  }, [volume]);

  return (
    <main className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        
        {/* SUCCESS ICON */}
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-yellow-400/10 rounded-[2rem] mb-4">
            <Trophy size={48} className="text-yellow-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter leading-none">
            {"Session"} <br /><span className="text-blue-500">{"Complete"}</span>
          </h1>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-blue-500/20 rounded-[3rem] p-8 shadow-2xl mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-5 dark:opacity-10 rotate-12">
            <Activity size={200} />
          </div>

          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{"Total Workload"}</p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-6xl font-black tracking-tighter text-blue-500">{volume || "0"}</span>
              <span className="text-xl font-bold text-slate-400">{"kg"}</span>
            </div>

            {/* AI COACH INSIGHT */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2rem] p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-blue-500" />
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{"AI Coach Insight"}</p>
              </div>
              
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-3/4"></div>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-300 font-semibold italic leading-relaxed text-sm">
                  {"\""}{aiInsight}{"\""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <button 
          onClick={() => router.push("/dashboard")}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 group"
        >
          {"Back to Dashboard"} 
          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
        </button>

        <div className="mt-8 flex justify-center gap-6 text-slate-400">
          <div className="flex items-center gap-1">
            <Zap size={14} className="text-orange-500" /> 
            <span className="text-[10px] font-black uppercase tracking-widest">{"Consistency +1"}</span>
          </div>
        </div>

      </div>
    </main>
  );
}