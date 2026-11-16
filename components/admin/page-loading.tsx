import { Skeleton } from "@/components/ui/skeleton";

type AdminPageLoadingProps = {
  /** Compact gate used while verifying the admin session. */
  fullscreen?: boolean;
  rows?: number;
};

export function AdminPageLoading({ fullscreen = false, rows = 3 }: AdminPageLoadingProps) {
  const body = (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full" />
      ))}
    </div>
  );

  if (!fullscreen) return body;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-3xl">{body}</div>
    </main>
  );
}
