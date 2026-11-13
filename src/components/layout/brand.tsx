import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 -rotate-6 place-items-center rounded-xl border-2 border-ink-950 bg-coin font-display text-xl leading-none text-ink-950 shadow-[0_3px_0_0_var(--color-coin-deep)]",
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
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
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
