import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-black p-6 pb-24 text-white">
      <SkeletonScreen>
        <div className="mx-auto max-w-md">
          <Skeleton className="mb-8 h-6 w-28" />
          <Skeleton className="mb-2 h-9 w-56" />
          <Skeleton className="mb-8 h-12 w-full" />
          <Skeleton className="mb-6 h-24 rounded-[2rem]" />
          <Skeleton className="h-44 rounded-[2rem]" />
        </div>
      </SkeletonScreen>
    </main>
  );
}
