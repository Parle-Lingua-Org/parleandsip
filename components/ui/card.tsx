import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: ComponentProps<"article">) {
  return (
    <article
      data-slot="card"
      className={cn("border-2 border-border bg-card text-card-foreground shadow-[4px_4px_0_var(--foreground)]", className)}
      {...props}
    />
  );
}

export { Card };