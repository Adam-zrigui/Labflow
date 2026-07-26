import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token
  ? new Redis({ url, token })
  : null;

export const rateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
    })
  : null;

/**
 * Check rate limit for a given key (typically IP address).
 * Returns { success: true } when no limiter is configured (dev/test) or
 * when the request is within limits.
 */
export async function checkRateLimit(key: string): Promise<{ success: boolean }> {
  if (!rateLimiter) {
    return { success: true };
  }
  return rateLimiter.limit(key);
}
