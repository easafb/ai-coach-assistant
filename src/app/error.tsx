"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Sayfa hatası:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#050505] p-6 text-white">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-black tracking-tighter">Bir şeyler ters gitti</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Beklenmedik bir hata oluştu. Tekrar denemek işe yarayabilir.
        </p>
        <button
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold active:scale-95"
        >
          <RotateCw size={18} /> Tekrar dene
        </button>
      </div>
    </main>
  );
}
