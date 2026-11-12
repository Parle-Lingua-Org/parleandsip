import Image from "next/image";
import LogoUse from "@/app/logo.webp";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ size = 32, className, priority = false }: BrandLogoProps) {
  return (
    <span className={cn("grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <Image
        src={LogoUse}
        alt="Parle & Sip"
        width={size}
        height={size}
        className="object-contain"
        priority={priority}
      />
    </span>
  );
}
