interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  /**
   * Check if a request should be limited.
   * @param key Identifier (e.g., client IP, user ID, route key)
   * @param maxRequests Maximum allowed requests in window
   * @param windowMs Window size in milliseconds
   * @returns { allowed: boolean, remaining: number, resetMs: number }
   */
  public check(
    key: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    this.cleanupOldRecords(windowMs);

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside the current window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = windowMs - (now - oldest);
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: maxRequests - record.timestamps.length,
      resetMs: windowMs,
    };
  }

  private cleanupOldRecords(windowMs: number) {
    const now = Date.now();
    // Only cleanup once every 60 seconds
    if (now - this.lastCleanup < 60000) return;
    this.lastCleanup = now;

    this.store.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    });
  }
}

// Global singleton instance
export const rateLimiter = new InMemoryRateLimiter();

/**
 * Standard client IP resolver for Next.js request.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
