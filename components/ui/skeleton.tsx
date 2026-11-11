import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse border-2 border-dap-border-muted bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
