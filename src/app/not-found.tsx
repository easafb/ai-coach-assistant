import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#050505] p-6 text-white">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-black tracking-tighter">Sayfa bulunamadı</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Aradığın antrenman ya da rutin artık burada değil.
        </p>
        <Link
          href="/dashboard"
          className="block w-full rounded-2xl bg-blue-600 py-4 font-bold active:scale-95"
        >
          Panele dön
        </Link>
      </div>
    </main>
  );
}
