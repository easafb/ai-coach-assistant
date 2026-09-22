import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { requireUser, displayName } from "@/lib/dal";
import AccountPanel from "@/components/account/AccountPanel";

/**
 * Hesap sayfası. requireConsent DEĞİL requireUser kullanıyor: rızasını geri
 * çekmek isteyen kullanıcı da hesabını silebilmeli.
 */
export default async function AccountPage() {
  const user = await requireUser();

  return (
    <main className="min-h-dvh bg-[#050505] p-6 pb-24 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href="/dashboard"
          className="mb-8 flex min-h-11 w-fit items-center gap-2 font-bold text-slate-400 transition-colors hover:text-white"
        >
          <ChevronLeft size={20} /> Panel
        </Link>

        <h1 className="mb-2 text-3xl font-black tracking-tight">Hesabım</h1>
        <p className="mb-8 text-sm text-neutral-500">
          {displayName(user)} · {user.email}
        </p>

        <AccountPanel />
      </div>
    </main>
  );
}
