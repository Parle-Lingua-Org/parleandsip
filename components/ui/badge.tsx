import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex w-fit items-center border px-2 py-1 text-[10px] font-medium", {
  variants: {
    variant: {
      default: "border-foreground bg-primary text-primary-foreground",
      secondary: "border-foreground bg-secondary text-secondary-foreground",
      accent: "border-foreground bg-accent text-accent-foreground",
      outline: "border-foreground bg-card text-card-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };