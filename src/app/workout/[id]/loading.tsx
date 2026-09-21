import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#050505] p-6 text-white">
      <SkeletonScreen>
        <div className="mx-auto max-w-md py-10">
          <Skeleton className="mb-6 h-10 w-10 rounded-xl" />
          <Skeleton className="mb-2 h-9 w-56" />
          <Skeleton className="mb-8 h-5 w-64" />

          <div className="mb-8 space-y-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>

          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </SkeletonScreen>
    </main>
  );
}
