"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";

import { createRoutinesFromTemplateAction } from "@/app/actions/workoutActions";
import { ROUTINE_TEMPLATES } from "@/lib/templates";

/**
 * Hiç rutini olmayan kullanıcıya gösterilir. Boş bir panel, değeri görmeden
 * önce kullanıcıdan program icat etmesini istiyordu; terk oranının en yüksek
 * olduğu an burasıydı.
 */
export default function TemplatePicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const apply = (templateId: string) => {
    setSelected(templateId);
    setError(null);
    startTransition(async () => {
      const result = await createRoutinesFromTemplateAction(templateId);
      if (result.ok) {
        // Ayrı şablon sayfasından çağrıldığında kullanıcıyı panele alıyoruz;
        // boş panelde çağrıldığında zaten oradayız ve liste tazeleniyor.
        router.push("/dashboard");
      } else {
        setError(result.error);
        setSelected(null);
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Sparkles size={18} className="text-blue-500" />
        <p className="text-sm font-medium text-neutral-400">
          Bir programla başla — sonra istediğin gibi düzenleyebilirsin.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {ROUTINE_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6"
          >
            <h3 className="text-xl font-bold">{template.title}</h3>
            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-blue-500">
              {template.subtitle}
            </p>
            <p className="mb-4 text-sm leading-relaxed text-neutral-400">
              {template.description}
            </p>

            <div className="mb-5 flex flex-wrap gap-2">
              {template.routines.map((routine) => (
                <span
                  key={routine.name}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-neutral-300"
                >
                  {routine.name}
                  <span className="text-neutral-600">
                    {" · "}
                    {routine.exercises.length} hareket
                  </span>
                </span>
              ))}
            </div>

            <button
              onClick={() => apply(template.id)}
              disabled={isPending}
              className="w-full rounded-2xl bg-blue-600 py-3 font-bold transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              {isPending && selected === template.id
                ? "Ekleniyor..."
                : "Bu programı kullan"}
            </button>
          </div>
        ))}
      </div>

      <Link
        href="/routines/new"
        className="mt-6 flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-neutral-800 py-5 font-bold text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white"
      >
        <Plus size={20} /> Kendi rutinimi oluşturayım
      </Link>
    </div>
  );
}
