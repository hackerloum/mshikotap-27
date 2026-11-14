import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg bg-coin font-display text-lg font-extrabold leading-none text-ink-950",
        className,
      )}
    >
      M
    </span>
  );
}

export function Brand({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="MshikoTap home"
    >
      <BrandMark />
      <span className={cn("font-display leading-none text-white", sizes[size])}>
        Mshiko<span className="text-coin">Tap</span>
      </span>
    </Link>
  );
}
