"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react"; 
import { 
  getRoutinesAction, 
  getWeeklyVolumeAction, 
  deleteRoutineAction // Silme aksiyonunu ekledik
} from "@/app/actions/workoutActions"; 
import { Plus, Play, Dumbbell, Calendar, ChevronRight, Trash2 } from "lucide-react"; // Trash2 eklendi
import BottomNav from "@/components/navigation/BottomNav";

interface Routine {
  id: string;
  name: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<number>(0); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [routinesRes, volumeRes] = await Promise.all([
        getRoutinesAction(),
        getWeeklyVolumeAction()
      ]);
      
      if (routinesRes.routines) {
        setRoutines(routinesRes.routines as Routine[]);
      }
      if (volumeRes && typeof volumeRes.volume === 'number') {
        setWeeklyVolume(volumeRes.volume);
      }
      setLoading(false);
    }

    loadData();
  }, []); 

  // SİLME FONKSİYONU
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Kartın tıklanıp idmana gitmesini engeller
    e.stopPropagation(); // Tıklama olayının yayılmasını durdurur

    if (!confirm("Are you sure you want to delete this routine?")) return;

    const res = await deleteRoutineAction(id);
    if (res.success) {
      // Sayfayı yenilemeden state'den silerek anlık geri bildirim veriyoruz
      setRoutines(prev => prev.filter(r => r.id !== id));
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">{"Welcome back, Emir"}</h1>
            <p className="text-neutral-500 font-medium italic">{"It's a great day to hit your goals. 🦾"}</p>
          </div>
          <button 
            onClick={() => router.push("/routines/new")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20"
          >
            <Plus size={20} />
            {"New Routine"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SOL KOLON: ÖZETLER */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl">
              <h3 className="text-neutral-400 text-sm font-bold uppercase tracking-widest mb-4">{"Weekly Summary"}</h3>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
                <span className="text-neutral-300">{"Total Volume"}</span>
                <span className="text-blue-400 font-mono font-bold text-xl">{weeklyVolume.toLocaleString()} kg</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-800/30 p-6 rounded-3xl">
              <h3 className="text-blue-400 text-sm font-bold uppercase mb-2">{"AI Coach Insights"}</h3>
              <p className="text-neutral-300 text-sm leading-relaxed">{"Everything looks solid. Let's crush this session!"}</p>
            </div>
          </div>

          {/* SAĞ KOLON: PROGRAMLAR */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Dumbbell className="text-blue-500" /> {"My Programs"}
            </h2>

            {loading ? (
              <div className="w-full h-32 bg-neutral-900 animate-pulse rounded-3xl"></div>
            ) : routines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routines.map((routine: Routine) => (
                  <div key={routine.id} className="relative group">
                    {/* SİLME BUTONU: Kartın sağ üst köşesine yerleştirildi */}
                    <button 
                      onClick={(e) => handleDelete(e, routine.id)}
                      className="absolute top-4 right-4 z-20 p-2 text-neutral-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Routine"
                    >
                      <Trash2 size={20} />
                    </button>

                    <Link 
                      href={`/workout/${routine.id}`} 
                      className="block bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <h4 className="text-xl font-bold mb-1">{routine.name}</h4>
                        <p className="text-neutral-500 text-sm flex items-center gap-1 mb-4">
                          <Calendar size={14} /> {new Date(routine.created_at).toLocaleDateString()}
                        </p>
                        <div className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-bold text-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <Play size={16} fill="currentColor" /> {"Start"}
                        </div>
                      </div>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-800 group-hover:text-blue-500/30 transition-all" size={48} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-900/30 border-2 border-dashed border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 font-medium">
                {"You haven't created a routine yet."}
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}