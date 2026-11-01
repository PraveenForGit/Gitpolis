const g = globalThis as unknown as { __gitpolisHits?: Map<string, number[]> };
if (!g.__gitpolisHits) g.__gitpolisHits = new Map();
const hits = g.__gitpolisHits;

const PRUNE_ABOVE = 5000;
const STALE_AFTER_MS = 60 * 60 * 1000;

export interface ThrottleResult {
  allowed: boolean;
  retryAfterSec: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): ThrottleResult {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)),
    };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > PRUNE_ABOVE) {
    for (const [k, times] of hits) {
      if (now - times[times.length - 1] > STALE_AFTER_MS) hits.delete(k);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clearRateLimits() {
  hits.clear();
}

// Best-effort client identity from proxy headers (Vercel and most hosts set these).
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}