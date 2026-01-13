/**
 * In-Memory Rate Limiter
 * Simple rate limiting using Map to track requests per IP
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Rate limit storage: IP -> entry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval: remove expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Start cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now >= entry.resetAt) {
        rateLimitStore.delete(ip);
      }
    }
  }, CLEANUP_INTERVAL);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

startCleanup();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

// Rate limits for different endpoint types
export const RATE_LIMITS = {
  // Heavy endpoints (analyze, report download)
  HEAVY: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Light endpoints (upload, checkout)
  LIGHT: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

/**
 * Check if request should be rate limited
 * @returns null if allowed, or remaining time in ms if limited
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): { allowed: boolean; remaining?: number; resetAt?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // No entry or expired - allow and create new entry
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const remaining = entry.resetAt - now;
    return {
      allowed: false,
      remaining,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return { allowed: true };
}

/**
 * Get rate limit info for an IP (for debugging)
 */
export function getRateLimitInfo(ip: string): {
  count: number;
  resetAt: number;
  remaining: number;
} | null {
  const entry = rateLimitStore.get(ip);
  if (!entry) return null;

  const now = Date.now();
  const remaining = Math.max(0, entry.resetAt - now);

  return {
    count: entry.count,
    resetAt: entry.resetAt,
    remaining,
  };
}
