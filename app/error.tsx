"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toUserMessage } from "@/lib/errors";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md border-2 border-foreground bg-card p-6 text-center shadow-[4px_4px_0_var(--foreground)]">
        <p className="font-mono text-[9px] tracking-wide text-muted-foreground">SOMETHING WENT WRONG</p>
        <h1 className="mt-2 text-2xl font-bold">We hit a snag.</h1>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {toUserMessage(error, "Please refresh and try again.")}
        </p>
        <Button className="mt-5" type="button" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
