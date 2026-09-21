import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-[#050505] p-6 pb-32 text-white md:p-12">
      <SkeletonScreen>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Skeleton className="mb-3 h-9 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-12 w-40" />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Skeleton className="h-28 rounded-3xl lg:col-span-1" />
            <div className="lg:col-span-2">
              <Skeleton className="mb-6 h-8 w-44" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-40 rounded-3xl" />
                <Skeleton className="h-40 rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      </SkeletonScreen>
    </div>
  );
}
