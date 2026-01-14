import { createClient } from "@/lib/supabase/server";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "ai-categorize": { maxRequests: 10, windowSeconds: 60 },
  "ai-insights": { maxRequests: 10, windowSeconds: 60 },
  "ai-query": { maxRequests: 10, windowSeconds: 60 },
  "ai-maintenance": { maxRequests: 10, windowSeconds: 60 },
  "ai-scenario": { maxRequests: 10, windowSeconds: 60 },
  "ai-advisor": { maxRequests: 30, windowSeconds: 60 },
  "transaction-import": { maxRequests: 5, windowSeconds: 60 },
  "data-export": { maxRequests: 1, windowSeconds: 3600 },
  "invite-create": { maxRequests: 5, windowSeconds: 3600 },
  "login-attempt": { maxRequests: 5, windowSeconds: 900 },
  default: { maxRequests: 60, windowSeconds: 60 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check rate limit using database-backed storage
 * This provides persistence across server restarts and multi-instance deployments
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const now = Date.now();

  try {
    const supabase = await createClient();

    // Call the database function to check and update rate limit
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });

    if (error) {
      // On database error, fail open but log it
      console.error("Rate limit check failed:", error.message);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowSeconds * 1000,
      };
    }

    const result = data?.[0] || { allowed: true, remaining: config.maxRequests };
    const resetTime = result.reset_at
      ? new Date(result.reset_at).getTime()
      : now + config.windowSeconds * 1000;

    const rateLimitResult: RateLimitResult = {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime,
    };

    if (!result.allowed) {
      rateLimitResult.retryAfter = Math.ceil((resetTime - now) / 1000);
    }

    return rateLimitResult;
  } catch (error) {
    // On any error, fail open to avoid blocking legitimate requests
    console.error("Rate limit error:", error instanceof Error ? error.message : "Unknown error");
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowSeconds * 1000,
    };
  }
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
