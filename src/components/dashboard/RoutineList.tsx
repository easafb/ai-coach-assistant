"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Play, Calendar, ChevronRight, Trash2, Pencil, RotateCw } from "lucide-react";

import { deleteRoutineAction } from "@/app/actions/workoutActions";
import TemplatePicker from "@/components/dashboard/TemplatePicker";
import type { RoutineWithState } from "@/lib/queries";

export default function RoutineList({ routines }: { routines: RoutineWithState[] }) {
  const [pendingDelete, setPendingDelete] = useState<RoutineWithState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;

    startTransition(async () => {
      const result = await deleteRoutineAction(target.id);
      if (result.ok) {
        // revalidatePath sunucudaki listeyi tazeliyor, elle state tutmuyoruz.
        setPendingDelete(null);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  };

  // Boş durum artık bir çıkmaz sokak değil, başlangıç noktası.
  if (routines.length === 0) return <TemplatePicker />;

  return (
    <>
      <div className="stagger-children grid grid-cols-1 gap-4 md:grid-cols-2">
        {routines.map((routine) => (
          <div key={routine.id} className="group relative">
            {/* Dokunmatikte hover yok; bu yüzden butonlar mobilde her zaman
                görünür, imleçli cihazlarda karta gelince beliriyor. */}
            <div className="absolute right-3 top-3 z-20 flex gap-1 opacity-100 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
              <Link
                href={`/routines/${routine.id}/edit`}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:text-white"
                aria-label={`${routine.name} rutinini düzenle`}
              >
                <Pencil size={18} />
              </Link>
              <button
                onClick={() => {
                  setError(null);
                  setPendingDelete(routine);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:text-red-500"
                aria-label={`${routine.name} rutinini sil`}
              >
                <Trash2 size={18} />
              </button>
            </div>

            <Link
              href={`/workout/${routine.id}`}
              className={`relative block overflow-hidden rounded-3xl border p-6 transition-all ${
                routine.openSession
                  ? "border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70"
                  : "border-neutral-800 bg-neutral-900 hover:border-blue-500/50"
              }`}
            >
              <div className="relative z-10">
                <h3 className="mb-1 pr-24 text-xl font-bold">{routine.name}</h3>

                {/* Yarım kalan antrenman panelden görünmeliydi: birden fazla
                    programı olan kullanıcı hangisinin yarım kaldığını karta
                    girmeden anlayamıyordu. */}
                {routine.openSession ? (
                  <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                    <RotateCw size={14} />
                    Yarım kaldı · {routine.openSession.setCount} set kayıtlı
                  </p>
                ) : (
                  <p className="mb-4 flex items-center gap-1 text-sm text-neutral-500">
                    <Calendar size={14} />
                    {new Date(routine.created_at).toLocaleDateString("tr-TR")}
                  </p>
                )}

                <span
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                    routine.openSession
                      ? "bg-amber-500 text-black"
                      : "bg-white text-black group-hover:bg-blue-500 group-hover:text-white"
                  }`}
                >
                  {routine.openSession ? (
                    <>
                      <RotateCw size={16} /> Devam Et
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" /> Başlat
                    </>
                  )}
                </span>
              </div>
              <ChevronRight
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all ${
                  routine.openSession
                    ? "text-amber-500/20"
                    : "text-neutral-800 group-hover:text-blue-500/30"
                }`}
                size={48}
              />
            </Link>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
        >
          <div className="animate-rise w-full max-w-sm rounded-3xl border border-neutral-800 bg-neutral-900 p-8">
            <h3 className="mb-2 text-xl font-bold">Rutini sil</h3>
            <p className="mb-6 text-sm text-neutral-400">
              <span className="font-semibold text-white">{pendingDelete.name}</span> ve
              içindeki tüm egzersizler kalıcı olarak silinecek.
            </p>

            {error && (
              <p role="alert" className="mb-4 text-sm font-medium text-red-400">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={isPending}
                className="flex-1 rounded-2xl border border-neutral-800 py-3 font-bold text-neutral-300 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 rounded-2xl bg-red-600 py-3 font-bold text-white disabled:opacity-50"
              >
                {isPending ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
