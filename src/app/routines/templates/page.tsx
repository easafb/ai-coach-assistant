import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { requireUser } from "@/lib/dal";
import TemplatePicker from "@/components/dashboard/TemplatePicker";

/**
 * Hazır programlar sayfası.
 *
 * Şablonlar önceden yalnızca boş panelde görünüyordu, yani bir rutini olan
 * hiç kimse onlara ulaşamıyordu. Oysa hazır program eklemek onboarding'e
 * özgü bir iş değil: yeni bir bölünmeye geçen kullanıcı da ister.
 */
export default async function TemplatesPage() {
  await requireUser();

  return (
    <main className="min-h-dvh bg-[#050505] p-6 pb-24 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href="/dashboard"
          className="mb-8 flex w-fit items-center gap-2 font-bold text-slate-400 transition-colors hover:text-white"
        >
          <ChevronLeft size={20} /> Panel
        </Link>

        <h1 className="mb-2 text-3xl font-black">
          Hazır <span className="text-blue-500">Programlar</span>
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          Seçtiğin program hesabına kopyalanır; sonrasında istediğin gibi
          düzenleyebilirsin. Mevcut rutinlerin silinmez.
        </p>

        <TemplatePicker />
      </div>
    </main>
  );
}
