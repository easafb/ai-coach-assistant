"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRoutineAction } from '@/app/actions/workoutActions';
import { Plus, Trash2, ChevronLeft,Home } from 'lucide-react';

interface ExerciseInput {
  name: string;
  sets: number | string;
  reps: number | string;
}

export default function NewRoutine() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<ExerciseInput[]>([{ name: '', sets: 3, reps: 10 }]);
  const [isSaving, setIsSaving] = useState(false);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: 10 }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseInput, value: string) => {
    const newExercises = [...exercises];
    let finalValue: string | number = value;

    if (field === 'sets' || field === 'reps') {
      finalValue = value === '' ? '' : parseInt(value, 10);
    }

    newExercises[index] = { ...newExercises[index], [field]: finalValue } as ExerciseInput;
    setExercises(newExercises);
  };

  const handleSave = async () => {
    if (!name || exercises.some(ex => !ex.name)) {
      alert("Please fill in all fields!");
      return;
    }
    setIsSaving(true);
    
    // Veriyi temizleyip sayıya zorluyoruz
    const cleanedExercises = exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets === '' ? 0 : Number(ex.sets),
      reps: ex.reps === '' ? 0 : Number(ex.reps)
    }));

    try {
      const res = await createRoutineAction(name, cleanedExercises);
      if (res.success) {
        router.push('/');
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-md mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 font-bold hover:text-white transition-colors">
            <ChevronLeft size={20} /> Back
          </button>
          
          <Link href="/" className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full transition-all">
            <Home size={20} />
          </Link>
        </div>

        <h1 className="text-3xl font-black mb-8">Create <span className="text-blue-500">Plan</span></h1>

        <div className="space-y-6">
          <div className="bg-[#1C1C1E] p-6 rounded-[2rem] border border-white/5">
            <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 block">Routine Name</label>
            <input 
              type="text" 
              placeholder="e.g. Upper Body" 
              className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-slate-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {exercises.map((ex, index) => (
              <div key={index} className="bg-[#1C1C1E] p-6 rounded-[2rem] border border-white/5 relative group">
                <input 
                  placeholder="Exercise Name" 
                  className="w-full bg-transparent font-bold text-lg outline-none mb-4"
                  value={ex.name}
                  onChange={(e) => updateExercise(index, 'name', e.target.value)}
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sets</label>
                    <input 
                      type="number" 
                      className="w-full bg-transparent font-bold outline-none" 
                      value={ex.sets} 
                      onChange={(e) => updateExercise(index, 'sets', e.target.value)} 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Reps</label>
                    <input 
                      type="number" 
                      className="w-full bg-transparent font-bold outline-none" 
                      value={ex.reps} 
                      onChange={(e) => updateExercise(index, 'reps', e.target.value)} 
                    />
                  </div>
                  <button onClick={() => removeExercise(index)} className="text-red-500/50 hover:text-red-500 pt-4">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addExercise} className="w-full py-4 border-2 border-dashed border-white/10 rounded-[2rem] text-slate-400 font-bold flex items-center justify-center gap-2">
            <Plus size={20} /> Add Exercise
          </button>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-500 text-white font-black py-5 rounded-[2rem] text-lg active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Routine"}
          </button>
        </div>
      </div>
    </main>
  );
}