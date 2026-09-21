"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { RotateCw } from "lucide-react";

import { reportClientErrorAction } from "@/app/actions/feedbackActions";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  // Next 16: reset yerine unstable_retry. Fark önemli — reset yalnızca durumu
  // temizler, veriyi yeniden çekmez. Sunucu tarafı bir sorgu patladığında
  // reset ile "Tekrar dene" hiçbir şey yapmıyordu.
  unstable_retry: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error("Sayfa hatası:", error);
    // Beta: hata kullanıcı bir şey yapmadan bize ulaşsın.
    void reportClientErrorAction(error.message, {
      pathname,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error, pathname]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#050505] p-6 text-white">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-black tracking-tighter">Bir şeyler ters gitti</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Hata bize otomatik olarak iletildi. Tekrar denemek işe yarayabilir.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold active:scale-95"
        >
          <RotateCw size={18} /> Tekrar dene
        </button>
      </div>
    </main>
  );
}
