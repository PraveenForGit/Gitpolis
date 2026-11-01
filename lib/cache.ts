interface Entry {
  value: unknown;
  expires: number;
}
 
interface CacheState {
  store: Map<string, Entry>;
  inflight: Map<string, Promise<unknown>>;
}
 
const g = globalThis as unknown as { __gitpolisCache?: CacheState };
if (!g.__gitpolisCache) {
  g.__gitpolisCache = { store: new Map(), inflight: new Map() };
}
const { store, inflight } = g.__gitpolisCache;
 
const MAX_ENTRIES = 500;
 
function put(key: string, value: unknown, ttlMs: number) {
  store.delete(key); // re-insert so Map order reflects recency
  store.set(key, { value, expires: Date.now() + ttlMs });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}
 
export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  shouldCache: (value: T) => boolean = () => true
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
 
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
 
  const promise = (async () => {
    try {
      const value = await fn();
      if (shouldCache(value)) put(key, value, ttlMs);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
 
  inflight.set(key, promise);
  return promise;
}
 
export function clearCache() {
  store.clear();
  inflight.clear();
}