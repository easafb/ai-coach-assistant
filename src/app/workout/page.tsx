"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getRoutineExercisesAction, 
  startWorkoutAction, 
  logSetAction, 
  finishWorkoutAction 
} from "@/app/actions/workoutActions";
import { CheckCircle2, ChevronRight,  Timer, Activity } from "lucide-react";

// Bileşenlerini (TopBar/BottomNav) şimdilik placeholder olarak bırakıyorum, varsa import edersin
// import TopBar from '@/components/navigation/TopBar';
// import BottomNav from '@/components/navigation/BottomNav';

interface Exercise {
  exercise_name: string;
  default_sets: number;
  default_reps: number;
}

export default function ActiveWorkout() {
  const { id } = useParams();
  const router = useRouter();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentReps, setCurrentReps] = useState("");
  const [totalVolume, setTotalVolume] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);

  // 1. Verileri Başlat
  useEffect(() => {
    async function init() {
      const exRes = await getRoutineExercisesAction(id as string);
      if (exRes.exercises) setExercises(exRes.exercises as Exercise[]);

      const sessRes = await startWorkoutAction("In Progress Session");
      if (sessRes.session) setSessionId(sessRes.session.id);
    }
    init();
  }, [id]);

  // 2. Timer
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // 3. Log Set
  const handleLogSet = async () => {
    if (!currentWeight || !currentReps || !sessionId || exercises.length === 0) return;

    const weightNum = parseFloat(currentWeight);
    const repsNum = parseInt(currentReps);

    const res = await logSetAction(
      sessionId,
      exercises[currentExerciseIndex].exercise_name,
      weightNum,
      repsNum
    );

    if (res.success) {
      setTotalVolume(prev => prev + (weightNum * repsNum));
      setCompletedSets(prev => prev + 1);
      setCurrentReps(""); 
      setCurrentWeight("");
    }
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    const res = await finishWorkoutAction(sessionId, totalVolume);
    if (res.success) {
      router.push(`/workout/summary/${sessionId}?volume=${totalVolume}`);
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const currentEx = exercises[currentExerciseIndex];

  return (
    <main className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white pb-32">
      {/* <TopBar /> */}
      
      <div className="px-6 mt-8 max-w-md mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-black tracking-tighter leading-none">
              {"Active"} <br /><span className="text-blue-500">{"Session"}</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-black mt-4 uppercase tracking-[0.2em]">
              {"Volume: "}{totalVolume}{" kg moved"}
            </p>
          </div>
          <div className="bg-blue-500/10 p-4 rounded-3xl border border-blue-500/20">
            <Timer className="text-blue-500 mb-1" size={20} />
            <span className="text-xl font-mono font-bold text-blue-500">{formatTime(seconds)}</span>
          </div>
        </header>

        {/* CURRENT EXERCISE CARD (PRO VERSION) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-blue-500/20 rounded-[2.5rem] p-8 mb-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-blue-500 animate-pulse" size={16} />
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">
              {"Step "}{currentExerciseIndex + 1}{" of "}{exercises.length}
            </p>
          </div>
          
          <h1 className="text-3xl font-black mb-1 leading-tight">{currentEx.exercise_name}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
            {"Target: "}{currentEx.default_sets}{" Sets • "}{currentEx.default_reps}{" Reps"}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{"Weight (kg)"}</label>
              <input 
                type="number" 
                className="w-full bg-transparent text-2xl font-bold focus:outline-none" 
                placeholder="0"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
              />
            </div>
            <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">{"Reps"}</label>
              <input 
                type="number" 
                className="w-full bg-transparent text-2xl font-bold focus:outline-none" 
                placeholder="0"
                value={currentReps}
                onChange={(e) => setCurrentReps(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleLogSet}
            className="w-full mt-6 bg-blue-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/30"
          >
            <CheckCircle2 size={20} /> {"Log Set"}
          </button>
        </div>

        {/* PROGRESS NAVIGATION */}
        <div className="flex gap-3">
          <button 
            onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
            className="flex-1 bg-white dark:bg-[#1C1C1E] py-4 rounded-2xl font-bold border border-slate-200 dark:border-white/5 text-slate-400"
          >
            {"Prev"}
          </button>
          
          {currentExerciseIndex === exercises.length - 1 ? (
            <button 
              onClick={handleFinish}
              className="flex-[2] bg-red-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-500/20"
            >
              {"Finish Session"}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentExerciseIndex(prev => Math.min(exercises.length - 1, prev + 1))}
              className="flex-[2] bg-black dark:bg-white dark:text-black text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
            >
              {"Next"} <ChevronRight size={20} />
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
          {"Sets completed: "}{completedSets}
        </p>
      </div>

      {/* <BottomNav /> */}
    </main>
  );
}