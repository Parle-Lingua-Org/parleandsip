import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <main className="mx-auto max-w-[960px] space-y-6 px-4 py-10 sm:px-8" role="status" aria-label="Loading">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-72 max-w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </main>
  );
}
