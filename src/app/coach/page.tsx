"use client";

import React, { useState } from 'react';
import BottomNav from '@/components/navigation/BottomNav';
import { Sparkles, Send, AlertTriangle, Activity } from 'lucide-react';
import { generateAdjustedWorkout } from '@/services/aiService';

export default function CoachPage() {
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleConsultation = async () => {
    if (!userInput) return;
    setIsAnalyzing(true);
    
    try {
      const res = await generateAdjustedWorkout({
        userLevel: 'intermediate',
        currentWorkout: [], 
        userFeedback: userInput
      }) as { aiAdjustmentNote: string };
      
      setAiResponse(res.aiAdjustmentNote);
    } catch (error) {
      setAiResponse("I couldn't connect right now. If you're experiencing pain, please prioritize resting.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 pb-32">
      <div className="max-w-md mx-auto">
        <header className="mb-12 pt-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-blue-500" size={20} />
            <span className="text-blue-500 font-bold text-xs uppercase tracking-widest">AI Performance Coach</span>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter">COACH.AI</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">How are you feeling today? Let&apos;s adjust your workout based on your condition.</p>
        </header>

        <div className="space-y-6">
          {/* Input Area */}
          <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Current Status / Pain</label>
            <textarea 
              className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-neutral-700 min-h-[120px] resize-none"
              placeholder="e.g., I feel a sharp pain in my left shoulder during Bench Press..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <button 
              onClick={handleConsultation}
              disabled={isAnalyzing || !userInput}
              className="w-full mt-4 bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30"
            >
              {isAnalyzing ? "Analyzing..." : <><Send size={18} /> Get Advice</>}
            </button>
          </div>

          {/* AI Result */}
          {aiResponse && (
            <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2.5rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-blue-500" size={20} />
                <span className="text-blue-500 font-black text-xs uppercase">Coach&apos;s Decision</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-medium">{aiResponse}</p>
              
              <div className="mt-6 pt-6 border-t border-white/5 flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[10px] text-slate-500 uppercase font-bold leading-tight">This is not medical advice. If you experience severe pain, please consult a professional.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}