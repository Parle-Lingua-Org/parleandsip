import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[1200px] space-y-6" role="status" aria-label="Loading">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-16 w-80 max-w-full" />
        <Skeleton className="h-20 w-full max-w-xl" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
          <Skeleton className="min-h-[320px] xl:col-span-6" />
          <Skeleton className="min-h-[190px] xl:col-span-3" />
          <Skeleton className="min-h-[190px] xl:col-span-3" />
        </div>
      </div>
    </main>
  );
}
