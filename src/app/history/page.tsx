import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";

import { getWorkoutHistory } from "@/lib/queries";
import BottomNav from "@/components/navigation/BottomNav";
import FeedbackButton from "@/components/feedback/FeedbackButton";

export default async function HistoryPage() {
  const history = await getWorkoutHistory();

  return (
    <div className="min-h-dvh bg-[#050505] p-6 pb-[calc(8rem+env(safe-area-inset-bottom))] text-white md:p-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="mb-8 flex w-fit items-center gap-2 text-neutral-500 transition-colors hover:text-white"
        >
          <ArrowLeft size={20} /> Panele dön
        </Link>

        <h1 className="mb-10 flex items-center gap-3 text-3xl font-black">
          <Calendar className="text-blue-500" /> Antrenman Geçmişi
        </h1>

        {history.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-neutral-800 bg-neutral-900/30 p-12 text-center font-medium text-neutral-500">
            Henüz tamamlanmış bir antrenmanın yok.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((session) => (
              <div
                key={session.id}
                className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700 md:flex-row md:items-center"
              >
                <div>
                  <h2 className="text-xl font-bold">
                    {session.routine_name ?? "Hızlı Antrenman"}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {session.end_time
                      ? new Date(session.end_time).toLocaleDateString("tr-TR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase text-neutral-600">
                    Hacim
                  </span>
                  <span className="font-mono text-lg font-bold text-blue-400">
                    {(session.total_volume ?? 0).toLocaleString("tr-TR")} kg
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FeedbackButton />
      <BottomNav />
    </div>
  );
}
