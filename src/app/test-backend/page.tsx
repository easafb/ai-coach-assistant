"use client";

import { useState } from "react";
import { 
  createRoutineAction, 
  startWorkoutAction, 
  logSetAction, 
  finishWorkoutAction 
} from "@/app/actions/workoutActions";

export default function TestBackend() {
  const [status, setStatus] = useState("Beklemede...");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 1. Rutin Oluşturma Testi
  const testCreateRoutine = async () => {
    setStatus("Rutin oluşturuluyor...");
    const result = await createRoutineAction("Test Push Day", [
      { name: "Bench Press", sets: 3, reps: 10 },
      { name: "Barbell Kayak Row", sets: 4, reps: 8 }
    ]);
    
    if (result.success) setStatus("Rutin Başarıyla Oluşturuldu! ID: " + result.routineId);
    else setStatus("Hata: " + result.error);
  };

  // 2. İdmanı Başlatma Testi
  const testStartWorkout = async () => {
    setStatus("İdman başlatılıyor...");
    const result = await startWorkoutAction("Test Push Day");
    if (result.session) {
      setCurrentSessionId(result.session.id);
      setStatus("İdman Başladı! Session ID: " + result.session.id);
    } else {
      setStatus("Hata: " + result.error);
    }
  };

  // 3. Set Kaydetme Testi
  const testLogSet = async () => {
    if (!currentSessionId) return setStatus("Önce idmanı başlatmalısın!");
    setStatus("Set kaydediliyor...");
    const result = await logSetAction(currentSessionId, "Bench Press", 60, 10);
    if (result.success) setStatus("Set Başarıyla Kaydedildi!");
    else setStatus("Hata: " + result.error);
  };

  return (
    <div className="p-10 bg-black min-h-screen text-white flex flex-col gap-6">
      <h1 className="text-2xl font-bold border-b border-neutral-800 pb-4">Backend Test Lab</h1>
      
      <p className="p-4 bg-neutral-900 rounded-lg text-blue-400">Durum: {status}</p>

      <div className="flex flex-wrap gap-4">
        <button onClick={testCreateRoutine} className="bg-green-600 px-6 py-2 rounded-lg font-bold">
          1. Rutin Oluştur (Push Day)
        </button>

        <button onClick={testStartWorkout} className="bg-blue-600 px-6 py-2 rounded-lg font-bold">
          2. İdmanı Başlat
        </button>

        <button onClick={testLogSet} className="bg-orange-600 px-6 py-2 rounded-lg font-bold">
          3. Set Kaydet (60kg x 10)
        </button>

        <button 
          onClick={() => finishWorkoutAction(currentSessionId!, 5000)} 
          className="bg-red-600 px-6 py-2 rounded-lg font-bold"
        >
          4. İdmanı Bitir (5000kg Hacim)
        </button>
      </div>

      <div className="mt-10 text-neutral-500 text-sm">
      </div>
    </div>
  );
}