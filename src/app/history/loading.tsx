import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-[#050505] p-6 pb-32 text-white md:p-12">
      <SkeletonScreen>
        <div className="mx-auto max-w-4xl">
          <Skeleton className="mb-8 h-6 w-36" />
          <Skeleton className="mb-10 h-9 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-24 rounded-3xl" />
          </div>
        </div>
      </SkeletonScreen>
    </div>
  );
}
