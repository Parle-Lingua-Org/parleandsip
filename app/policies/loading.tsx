import { Skeleton } from "@/components/ui/skeleton";

export default function PoliciesLoading() {
  return (
    <main className="mx-auto max-w-[860px] space-y-6 px-4 py-10 sm:px-8" role="status" aria-label="Loading">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-80 max-w-full" />
      <Skeleton className="h-16 w-full" />
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </main>
  );
}