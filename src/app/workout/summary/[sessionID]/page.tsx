import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ArrowRight, Activity, Timer, Layers, TrendingUp } from "lucide-react";

import { getSessionSummary } from "@/lib/queries";

/** "1s 12dk" ya da "42dk 08sn" biçiminde okunur süre. */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}s ${m}dk`;
  if (m > 0) return `${m}dk ${String(s).padStart(2, "0")}sn`;
  return `${s}sn`;
}

export default async function WorkoutSummaryPage({
  params,
}: {
  params: Promise<{ sessionID: string }>;
}) {
  const { sessionID } = await params;

  const session = await getSessionSummary(sessionID);
  if (!session) notFound();

  const volume = session.total_volume ?? 0;

  /*
   * Kalori bilerek gösterilmiyor. Ağırlık antrenmanında harcanan kalori
   * elimizdeki veriyle hesaplanamaz: vücut ağırlığı, yaş, nabız ve dinlenme
   * oranları gerekir. Yaygın formüller (MET x kilo x süre) sabit tempolu
   * kardiyo için tasarlanmış ve aralıklı ağırlık çalışmasında ciddi sapıyor.
   * Uydurma bir sayı göstermek yerine ölçülmüş bir kıyas veriyoruz.
   */
  const delta =
    session.previousVolume && session.previousVolume > 0
      ? Math.round(((volume - session.previousVolume) / session.previousVolume) * 100)
      : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black p-6 text-white">
      <div className="animate-rise w-full max-w-md">
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
            <p className="mt-1 text-xs font-medium text-slate-500">
              Bu seansta kaldırdığın toplam hacim
            </p>

            {delta !== null && (
              <p
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  delta >= 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                <TrendingUp size={13} className={delta < 0 ? "rotate-180" : ""} />
                Geçen sefere göre {delta >= 0 ? "+" : ""}
                {delta}%
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-6">
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Timer size={12} /> Süre
                </p>
                <p className="font-mono text-xl font-bold">
                  {session.durationSeconds !== null
                    ? formatDuration(session.durationSeconds)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Layers size={12} /> Set
                </p>
                <p className="font-mono text-xl font-bold">{session.setCount}</p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-[2rem] bg-white py-5 text-lg font-black text-black transition-all hover:scale-[1.02] active:scale-95"
        >
          Panele dön
          <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
        </Link>
      </div>
    </main>
  );
}
