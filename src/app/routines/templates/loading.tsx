import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#050505] p-6 pb-24 text-white">
      <SkeletonScreen>
        <div className="mx-auto max-w-md">
          <Skeleton className="mb-8 h-6 w-24" />
          <Skeleton className="mb-2 h-9 w-64" />
          <Skeleton className="mb-8 h-10 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
          </div>
        </div>
      </SkeletonScreen>
    </main>
  );
}
