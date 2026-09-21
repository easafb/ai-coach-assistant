import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#050505] p-6 pb-32 text-white">
      <SkeletonScreen>
        <div className="mx-auto max-w-md">
          <div className="mb-10 pt-8">
            <Skeleton className="mb-3 h-4 w-40" />
            <Skeleton className="mb-3 h-10 w-52" />
            <Skeleton className="h-5 w-full max-w-xs" />
          </div>
          <Skeleton className="h-64 rounded-[2.5rem]" />
        </div>
      </SkeletonScreen>
    </main>
  );
}
