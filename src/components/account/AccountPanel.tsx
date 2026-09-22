"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Trash2, Loader2, FileText, LogOut } from "lucide-react";

import { exportUserDataAction, deleteAccountAction } from "@/app/actions/accountActions";
import { createClient } from "@/lib/supabase/client";

export default function AccountPanel() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Yanlışlıkla silmeyi zorlaştırmak için yazarak onay.
  const CONFIRM_WORD = "SİL";

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      const result = await exportUserDataAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Dosyayı tarayıcıda oluşturup indiriyoruz; sunucuda dosya tutmuyoruz.
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coach-ai-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await createClient().auth.signOut();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Link
        href="/gizlilik"
        className="flex min-h-12 items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 font-bold transition-colors hover:border-neutral-700"
      >
        <FileText size={20} className="shrink-0 text-slate-400" />
        Aydınlatma metni
      </Link>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="mb-1 font-bold">Verilerimi indir</h2>
        <p className="mb-4 text-sm leading-relaxed text-neutral-500">
          Programların, antrenman geçmişin ve tüm set kayıtların JSON dosyası
          olarak iner.
        </p>
        <button
          onClick={handleExport}
          disabled={isPending}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/10 font-bold disabled:opacity-50"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          İndir
        </button>
      </div>

      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 font-bold text-slate-300 transition-colors hover:border-neutral-700 disabled:opacity-50"
      >
        <LogOut size={20} className="shrink-0 text-slate-400" />
        Çıkış yap
      </button>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="mb-1 font-bold text-red-400">Hesabımı sil</h2>
        <p className="mb-4 text-sm leading-relaxed text-neutral-400">
          Hesabın ve tüm antrenman geçmişin kalıcı olarak silinir.{" "}
          <strong className="text-white">Bu işlem geri alınamaz.</strong> Silmeden
          önce verilerini indirmek isteyebilirsin.
        </p>

        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 font-bold text-red-400"
          >
            <Trash2 size={18} /> Hesabımı sil
          </button>
        ) : (
          <div className="space-y-3">
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-neutral-300"
            >
              Onaylamak için <strong className="text-white">{CONFIRM_WORD}</strong>{" "}
              yaz:
            </label>
            <input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-xl bg-black/40 p-3 font-bold outline-none"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDelete(false);
                  setConfirmText("");
                }}
                disabled={isPending}
                className="min-h-12 flex-1 rounded-xl border border-white/10 font-bold text-slate-300 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending || confirmText !== CONFIRM_WORD}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 font-black text-white disabled:opacity-30"
              >
                {isPending && <Loader2 size={18} className="animate-spin" />}
                Kalıcı olarak sil
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-center text-sm font-medium text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
