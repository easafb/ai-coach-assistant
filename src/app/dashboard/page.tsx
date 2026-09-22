import Link from "next/link";
import { Plus, Dumbbell, LayoutGrid, UserCog } from "lucide-react";

import { requireConsent, displayName } from "@/lib/dal";
import { getRoutinesWithState, getWeeklyVolume } from "@/lib/queries";
import BottomNav from "@/components/navigation/BottomNav";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import RoutineList from "@/components/dashboard/RoutineList";

export default async function DashboardPage() {
  // Server Component: veri render sırasında sunucuda çekiliyor.
  // Eski hali useEffect ile client'tan istek atıyordu; o yüzden sayfa
  // önce boş geliyor, sonra doluyordu.
  const [user, routines, weeklyVolume] = await Promise.all([
    requireConsent(),
    getRoutinesWithState(),
    getWeeklyVolume(),
  ]);

  return (
    <div className="min-h-dvh bg-[#050505] p-6 pb-[calc(8rem+env(safe-area-inset-bottom))] text-white md:p-12">
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
          <div className="flex flex-wrap gap-3">
            <Link
              href="/hesap"
              aria-label="Hesabım"
              className="flex min-h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-slate-400 transition-all hover:border-neutral-700 hover:text-white active:scale-95"
            >
              <UserCog size={18} />
            </Link>
            <Link
              href="/routines/templates"
              className="flex min-h-12 items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-3 font-bold text-slate-300 transition-all hover:border-neutral-700 hover:text-white active:scale-95"
            >
              <LayoutGrid size={18} />
              Hazır Programlar
            </Link>
            <Link
              href="/routines/new"
              className="flex min-h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-105 hover:bg-blue-500 active:scale-95"
            >
              <Plus size={20} />
              Yeni Rutin
            </Link>
          </div>
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
      <FeedbackButton />
      <BottomNav />
    </div>
  );
}
