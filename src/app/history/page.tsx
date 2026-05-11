"use client";

import { useEffect, useState } from "react";
import { getWorkoutHistoryAction } from "@/app/actions/workoutActions";
import { Calendar, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface WorkoutSession {
  id: string;
  routine_name: string;
  total_volume: number;
  end_time: string;
}

export default function WorkoutHistory() {
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const res = await getWorkoutHistoryAction();
      if (res.history) setHistory(res.history);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-neutral-500 mb-8 hover:text-white transition-colors">
          <ArrowLeft size={20} /> {"Back to Dashboard"}
        </button>

        <h1 className="text-3xl font-black mb-10 flex items-center gap-3">
          <Calendar className="text-blue-500" /> {"Workout History"}
        </h1>

        <div className="space-y-4">
          {history.map((session) => (
            <div key={session.id} className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-neutral-700 transition-all">
              <div>
                <h3 className="text-xl font-bold">{session.routine_name || "Quick Session"}</h3>
                <p className="text-neutral-500 text-sm">{new Date(session.end_time).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-neutral-600 font-black uppercase">{"Volume"}</span>
                  <span className="text-blue-400 font-mono font-bold text-lg">{session.total_volume}{" kg"}</span>
                </div>
                <div className="flex flex-col items-center border-l border-neutral-800 pl-6">
                  <span className="text-[10px] text-neutral-600 font-black uppercase">{"Status"}</span>
                  <span className="text-green-500 font-bold text-sm flex items-center gap-1">
                    {"Completed"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}