
/**
 * Simple in-memory rate limiter for critical routes.
 * Cleans up expired entries on each call.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

export function rateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  
  // Cleanup expired entries
  for (const [key, value] of cache.entries()) {
    if (value.resetAt < now) {
      cache.delete(key);
    }
  }

  const entry = cache.get(identifier);

  if (!entry) {
    // First request in this window
    cache.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true };
  }

  if (entry.resetAt < now) {
    // Window expired
    cache.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true };
  }

  if (entry.count >= limit) {
    return { success: false };
  }

  // Increment count
  entry.count += 1;
  return { success: true };
}
