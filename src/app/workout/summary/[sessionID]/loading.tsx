import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-black p-6 text-white">
      <SkeletonScreen>
        <div className="w-full max-w-md">
          <div className="mb-10 flex flex-col items-center">
            <Skeleton className="mb-4 h-24 w-24 rounded-[2rem]" />
            <Skeleton className="h-10 w-56" />
          </div>
          <Skeleton className="mb-6 h-48 rounded-[3rem]" />
          <Skeleton className="h-16 rounded-[2rem]" />
        </div>
      </SkeletonScreen>
    </main>
  );
}
