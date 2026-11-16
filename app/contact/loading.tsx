import { Skeleton } from "@/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <main className="mx-auto max-w-[960px] space-y-6 px-4 py-10 sm:px-8" role="status" aria-label="Loading">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-12 w-56" />
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </main>
  );
}
