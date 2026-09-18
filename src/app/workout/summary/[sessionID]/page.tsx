import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ArrowRight, Activity } from "lucide-react";

import { getSessionSummary } from "@/lib/queries";

export default async function WorkoutSummaryPage({
  params,
}: {
  params: Promise<{ sessionID: string }>;
}) {
  const { sessionID } = await params;

  // Hacim artık query string'den değil veritabanından geliyor.
  // Eski hali ?volume=... okuyordu; URL'i elle değiştiren istediği sayıyı görebiliyordu.
  const session = await getSessionSummary(sessionID);
  if (!session) notFound();

  const volume = session.total_volume ?? 0;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex rounded-[2rem] bg-yellow-400/10 p-5">
            <Trophy size={48} className="text-yellow-500" />
          </div>
          <h1 className="text-4xl font-black leading-none tracking-tighter">
            Antrenman
            <br />
            <span className="text-blue-500">Tamamlandı</span>
          </h1>
        </div>

        <div className="relative mb-6 overflow-hidden rounded-[3rem] border border-blue-500/20 bg-[#1C1C1E] p-8 shadow-2xl">
          <div className="absolute -right-10 -top-10 rotate-12 opacity-10">
            <Activity size={200} />
          </div>

          <div className="relative z-10">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {session.routine_name ?? "Hızlı Antrenman"}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tighter text-blue-500">
                {volume.toLocaleString("tr-TR")}
              </span>
              <span className="text-xl font-bold text-slate-400">kg</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Bu seansta kaldırdığın toplam hacim
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="group flex w-full items-center justify-center gap-3 rounded-[2rem] bg-white py-5 text-lg font-black text-black transition-all hover:scale-[1.02] active:scale-95"
        >
          Panele dön
          <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
        </Link>
      </div>
    </main>
  );
}
