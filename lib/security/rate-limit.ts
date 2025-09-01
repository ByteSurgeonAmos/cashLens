// Rate limit configuration
const rateLimitConfigs = {
  "/api/auth": { max: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  "/api/graphql": { max: 100, window: 60 * 1000 }, // 100 requests per minute
  "/api/user": { max: 20, window: 60 * 1000 }, // 20 requests per minute
  default: { max: 50, window: 60 * 1000 }, // Default: 50 requests per minute
};

// Simple Map-based cache for storing rate limit data
const tokenCache = new Map<string, { count: number; resetTime: number }>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  tokenCache.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => tokenCache.delete(key));
}, 60 * 1000); // Cleanup every minute

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter?: number;
}

export async function rateLimit(
  identifier: string,
  route: string = "default"
): Promise<RateLimitResult> {
  // Get rate limit config for the route
  const config =
    rateLimitConfigs[route as keyof typeof rateLimitConfigs] ||
    rateLimitConfigs.default;

  const key = `${identifier}:${route}`;
  const now = Date.now();

  // Get existing rate limit data
  const existing = tokenCache.get(key);

  if (!existing || now > existing.resetTime) {
    // First request or window has expired
    tokenCache.set(key, {
      count: 1,
      resetTime: now + config.window,
    });

    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
    };
  }

  // Check if limit exceeded
  if (existing.count >= config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      retryAfter: Math.ceil((existing.resetTime - now) / 1000),
    };
  }

  // Increment counter
  existing.count++;
  tokenCache.set(key, existing);

  return {
    success: true,
    limit: config.max,
    remaining: config.max - existing.count,
  };
}

// Function to reset rate limit for a specific identifier
export function resetRateLimit(
  identifier: string,
  route: string = "default"
): void {
  const key = `${identifier}:${route}`;
  tokenCache.delete(key);
}

// Function to get current rate limit status
export function getRateLimitStatus(
  identifier: string,
  route: string = "default"
): { remaining: number; resetTime: number } | null {
  const key = `${identifier}:${route}`;
  const existing = tokenCache.get(key);

  if (!existing) {
    return null;
  }

  const config =
    rateLimitConfigs[route as keyof typeof rateLimitConfigs] ||
    rateLimitConfigs.default;

  return {
    remaining: Math.max(0, config.max - existing.count),
    resetTime: existing.resetTime,
  };
}
