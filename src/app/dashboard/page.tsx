import Link from "next/link";
import { Plus, Dumbbell } from "lucide-react";

import { requireUser, displayName } from "@/lib/dal";
import { getRoutines, getWeeklyVolume } from "@/lib/queries";
import BottomNav from "@/components/navigation/BottomNav";
import RoutineList from "@/components/dashboard/RoutineList";

export default async function DashboardPage() {
  // Server Component: veri render sırasında sunucuda çekiliyor.
  // Eski hali useEffect ile client'tan istek atıyordu; o yüzden sayfa
  // önce boş geliyor, sonra doluyordu.
  const [user, routines, weeklyVolume] = await Promise.all([
    requireUser(),
    getRoutines(),
    getWeeklyVolume(),
  ]);

  return (
    <div className="min-h-dvh bg-[#050505] p-6 pb-32 text-white md:p-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
              Tekrar hoş geldin, {displayName(user)}
            </h1>
            <p className="font-medium italic text-neutral-500">
              Hedeflerine bir adım daha yaklaşmak için harika bir gün. 🦾
            </p>
          </div>
          <Link
            href="/routines/new"
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-105 hover:bg-blue-500 active:scale-95"
          >
            <Plus size={20} />
            Yeni Rutin
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-400">
                Haftalık Özet
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Toplam Hacim</span>
                <span className="font-mono text-xl font-bold text-blue-400">
                  {weeklyVolume.toLocaleString("tr-TR")} kg
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold">
              <Dumbbell className="text-blue-500" /> Programlarım
            </h2>
            <RoutineList routines={routines} />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
