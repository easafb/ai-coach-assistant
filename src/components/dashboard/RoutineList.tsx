"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Play, Calendar, ChevronRight, Trash2 } from "lucide-react";

import { deleteRoutineAction } from "@/app/actions/workoutActions";
import TemplatePicker from "@/components/dashboard/TemplatePicker";
import type { Routine } from "@/types";

export default function RoutineList({ routines }: { routines: Routine[] }) {
  const [pendingDelete, setPendingDelete] = useState<Routine | null>(null);
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
            <button
              onClick={() => {
                setError(null);
                setPendingDelete(routine);
              }}
              className="absolute right-4 top-4 z-20 p-2 text-neutral-600 opacity-0 transition-colors hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`${routine.name} rutinini sil`}
            >
              <Trash2 size={20} />
            </button>

            <Link
              href={`/workout/${routine.id}`}
              className="relative block overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition-all hover:border-blue-500/50"
            >
              <div className="relative z-10">
                <h3 className="mb-1 text-xl font-bold">{routine.name}</h3>
                <p className="mb-4 flex items-center gap-1 text-sm text-neutral-500">
                  <Calendar size={14} />
                  {new Date(routine.created_at).toLocaleDateString("tr-TR")}
                </p>
                <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition-colors group-hover:bg-blue-500 group-hover:text-white">
                  <Play size={16} fill="currentColor" /> Başlat
                </span>
              </div>
              <ChevronRight
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-800 transition-all group-hover:text-blue-500/30"
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
