"use client";

import { useTransition } from "react";
import { X, ArrowLeftRight, TrendingDown, Ban } from "lucide-react";

import { dismissAdjustmentAction } from "@/app/actions/workoutActions";
import type { Adjustment, AdjustmentAction } from "@/lib/adjustments";

const ICON: Record<AdjustmentAction, typeof Ban> = {
  reduce_load: TrendingDown,
  swap: ArrowLeftRight,
  skip: Ban,
};

const LABEL: Record<AdjustmentAction, string> = {
  reduce_load: "Hafifletildi",
  swap: "Değiştirildi",
  skip: "Atlanıyor",
};

function daysLeft(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export default function ActiveAdjustments({
  adjustments,
}: {
  adjustments: Adjustment[];
}) {
  const [isPending, startTransition] = useTransition();

  const dismiss = (exerciseKey: string) => {
    startTransition(async () => {
      await dismissAdjustmentAction(exerciseKey);
    });
  };

  return (
    <section aria-labelledby="active-adjustments">
      <h2
        id="active-adjustments"
        className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500"
      >
        Programında aktif değişiklikler
      </h2>

      <ul className="space-y-2">
        {adjustments.map((adjustment) => {
          const Icon = ICON[adjustment.action];
          return (
            <li
              key={adjustment.exerciseKey}
              className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
            >
              <Icon size={18} className="mt-0.5 shrink-0 text-amber-500" />

              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {adjustment.exerciseName}
                  {adjustment.substituteName && (
                    <span className="font-medium text-slate-400">
                      {" → "}
                      {adjustment.substituteName}
                    </span>
                  )}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                  {LABEL[adjustment.action]} · {daysLeft(adjustment.expiresAt)} gün kaldı
                </p>
                <p className="mt-1 text-sm leading-snug text-slate-400">
                  {adjustment.reason}
                </p>
              </div>

              <button
                onClick={() => dismiss(adjustment.exerciseKey)}
                disabled={isPending}
                aria-label={`${adjustment.exerciseName} değişikliğini kaldır`}
                className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center text-slate-600 transition-colors hover:text-white disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
