/**
 * Cache em memória para dados calculados do dashboard.
 * TTL padrão: 5 minutos. Invalida automaticamente após uploads de dados.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function cacheInvalidate(keyPrefix?: string): void {
  if (!keyPrefix) {
    cache.clear();
    console.log('[Cache] Cache completamente invalidado');
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
  console.log(`[Cache] Cache invalidado para prefixo: ${keyPrefix}`);
}

/**
 * Executa fn apenas se não houver cache válido para a key.
 */
export async function cacheOrFetch<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) {
    console.log(`[Cache] HIT: ${key}`);
    return cached;
  }
  console.log(`[Cache] MISS: ${key} — calculando...`);
  const start = Date.now();
  const result = await fn();
  console.log(`[Cache] SET: ${key} (${Date.now() - start}ms)`);
  cacheSet(key, result, ttlMs);
  return result;
}
