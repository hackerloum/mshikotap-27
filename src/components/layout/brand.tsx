import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

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
    lg: "text-3xl md:text-5xl",
  };

  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-teal-300 to-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.35)]">
        <span className="text-sm font-black">M</span>
      </span>
      <span
        className={cn(
          "font-[family-name:var(--font-display)] font-semibold tracking-tight text-white",
          sizes[size],
        )}
      >
        {siteConfig.name}
      </span>
    </Link>
  );
}
