"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  getRoutineExercisesAction, 
  startWorkoutAction, 
  logSetAction, 
  finishWorkoutAction 
} from "@/app/actions/workoutActions";
// Gereksizleri sildik, Dumbbell'ı ekledik
import { CheckCircle2, ChevronRight, Dumbbell } from "lucide-react";

// 'any' hatasını bitiren tip tanımı
interface Exercise {
  exercise_name: string;
  default_sets: number;
  default_reps: number;
}

export default function ActiveWorkout() {
  const { id } = useParams();
  const router = useRouter();
  
  // State'i 'Exercise' tipine bağladık
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentReps, setCurrentReps] = useState("");
  const [totalVolume, setTotalVolume] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);

  // Verileri çekme ve idmanı başlatma
  useEffect(() => {
    async function init() {
      const exRes = await getRoutineExercisesAction(id as string);
      if (exRes.exercises) setExercises(exRes.exercises);

      const sessRes = await startWorkoutAction("Active Session");
      if (sessRes.session) setSessionId(sessRes.session.id);
    }
    init();
  }, [id]);

  // Kronometre mantığı
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // Set kaydetme işlemi
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
      router.push("/dashboard");
    }
  };

  if (exercises.length === 0) return <div className="p-20 text-white">{"Loading..."}</div>;

  const currentEx = exercises[currentExerciseIndex];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* HUD - Zaman ve Hacim */}
        <div className="flex justify-between items-center mb-10 bg-neutral-900/50 p-6 rounded-3xl border border-neutral-800">
          <div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-tighter">{"Time"}</p>
            <h2 className="text-2xl font-mono font-bold text-orange-400">{formatTime(seconds)}</h2>
          </div>
          <div className="text-right">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-tighter">{"Volume"}</p>
            <h2 className="text-2xl font-mono font-bold text-blue-400">{totalVolume}{" kg"}</h2>
          </div>
        </div>

        {/* Egzersiz Kartı */}
        <div className="bg-white text-black rounded-[2.5rem] p-8 mb-6 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-black uppercase">
              {"Exercise "}{currentExerciseIndex + 1}{"/"}{exercises.length}
            </span>
            <Dumbbell size={24} className="text-neutral-300" />
          </div>
          
          <h1 className="text-4xl font-black mb-2 leading-tight">{currentEx.exercise_name}</h1>
          <p className="text-neutral-400 font-bold mb-8">{"Target: "}{currentEx.default_sets}{" x "}{currentEx.default_reps}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-100 p-4 rounded-2xl">
              <label className="block text-[10px] font-black text-neutral-400 uppercase mb-1">{"Weight (kg)"}</label>
              <input 
                type="number" 
                className="w-full bg-transparent text-2xl font-bold focus:outline-none" 
                placeholder="0"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
              />
            </div>
            <div className="bg-neutral-100 p-4 rounded-2xl">
              <label className="block text-[10px] font-black text-neutral-400 uppercase mb-1">{"Reps"}</label>
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
            className="w-full mt-6 bg-black text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all active:scale-95"
          >
            <CheckCircle2 size={20} /> {"Log Set"}
          </button>
        </div>

        {/* Navigasyon Butonları */}
        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
            className="flex-1 bg-neutral-900 py-4 rounded-2xl font-bold border border-neutral-800"
          >
            {"Previous"}
          </button>
          
          {currentExerciseIndex === exercises.length - 1 ? (
            <button 
              onClick={handleFinish}
              className="flex-[2] bg-red-600 py-4 rounded-2xl font-bold shadow-lg shadow-red-900/20"
            >
              {"Finish Workout"}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentExerciseIndex(prev => Math.min(exercises.length - 1, prev + 1))}
              className="flex-[2] bg-blue-600 py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              {"Next Exercise"} <ChevronRight size={20} />
            </button>
          )}
        </div>

        <p className="mt-10 text-center text-neutral-600 text-sm font-medium">
          {"Sets logged this session: "}{completedSets}
        </p>

      </div>
    </div>
  );
}