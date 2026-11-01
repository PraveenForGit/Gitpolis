"use client";
import { useEffect, useState } from "react";

interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export default function RateLimitBadge() {
  const [rl, setRl] = useState<RateLimit | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/rate-limit");
        if (!res.ok) return;
        const data: RateLimit = await res.json();
        if (!cancelled) setRl(data);
      } catch {
        
      }
    }

    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!rl) return null;

  const low = rl.remaining / rl.limit < 0.1;
  const resetsAt = new Date(rl.reset * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      title={`GitHub API requests left this hour. Resets at ${resetsAt}.`}
      className={`hidden sm:block text-xs font-mono px-3 py-1 rounded-full border ${
        low ? "border-code text-code" : "border-border text-muted"
      }`}
    >
      GitHub API: {rl.remaining.toLocaleString()}/{rl.limit.toLocaleString()} left
    </div>
  );
}
