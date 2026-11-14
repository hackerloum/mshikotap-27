import { CircleDollarSign, Flame as FlameIcon, Star as StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  size?: number;
};

export function Coin({ className, size = 24 }: IconProps) {
  return (
    <CircleDollarSign
      width={size}
      height={size}
      strokeWidth={1.75}
      aria-hidden="true"
      className={cn("shrink-0 text-coin", className)}
    />
  );
}

export function Flame({ className, size = 24 }: IconProps) {
  return (
    <FlameIcon
      width={size}
      height={size}
      strokeWidth={1.75}
      aria-hidden="true"
      className={cn("shrink-0 text-flame", className)}
    />
  );
}

export function Star({ className, size = 24 }: IconProps) {
  return (
    <StarIcon
      width={size}
      height={size}
      strokeWidth={1.75}
      aria-hidden="true"
      className={cn("shrink-0 text-sky", className)}
    />
  );
}
