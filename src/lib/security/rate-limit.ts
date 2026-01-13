interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "ai-categorize": { maxRequests: 10, windowMs: 60000 },
  "ai-insights": { maxRequests: 10, windowMs: 60000 },
  "ai-query": { maxRequests: 10, windowMs: 60000 },
  "ai-maintenance": { maxRequests: 10, windowMs: 60000 },
  "ai-scenario": { maxRequests: 10, windowMs: 60000 },
  "transaction-import": { maxRequests: 5, windowMs: 60000 },
  "data-export": { maxRequests: 1, windowMs: 3600000 },
  "invite-create": { maxRequests: 5, windowMs: 3600000 },
  "login-attempt": { maxRequests: 5, windowMs: 900000 },
  default: { maxRequests: 60, windowMs: 60000 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  endpoint: string
): RateLimitResult {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  const result: RateLimitResult = {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };

  if (!allowed) {
    result.retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  }

  return result;
}

export function resetRateLimit(identifier: string, endpoint: string): void {
  const key = `${identifier}:${endpoint}`;
  rateLimitStore.delete(key);
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);
