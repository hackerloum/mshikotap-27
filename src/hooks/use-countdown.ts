"use client";

import { useEffect, useState } from "react";

export function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(endsAt).getTime() - Date.now()),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    remaining,
    days,
    hours,
    minutes,
    seconds,
    label: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    done: remaining <= 0,
  };
}
