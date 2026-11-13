import { cn } from "@/lib/utils";

export function Coin({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <circle cx="16" cy="17" r="13" fill="#c98a00" />
      <circle cx="16" cy="15" r="13" fill="#ffc21a" stroke="#0d1021" strokeWidth="2" />
      <circle cx="16" cy="15" r="8.5" fill="none" stroke="#c98a00" strokeWidth="2" />
      <path
        d="M12.5 19v-8l3.5 4.5 3.5-4.5v8"
        fill="none"
        stroke="#0d1021"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Flame({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path
        d="M16 2c1 5 8 8 8 16a8 8 0 0 1-16 0c0-4 2-6 3-8 1 2 2 3 3 3 0-4-1-7 2-11z"
        fill="#ff8a1f"
        stroke="#0d1021"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 17c1 2 4 3 4 6a4 4 0 0 1-8 0c0-2 2-3 4-6z"
        fill="#ffc21a"
      />
    </svg>
  );
}

export function Star({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path
        d="m16 3 3.9 8.1 8.9 1.2-6.5 6.2 1.6 8.8L16 23l-7.9 4.3 1.6-8.8L3.2 12.3l8.9-1.2z"
        fill="#3ab4ff"
        stroke="#0d1021"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
