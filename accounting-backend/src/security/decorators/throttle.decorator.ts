import { SetMetadata } from "@nestjs/common";

export const THROTTLER_SKIP = "throttler_skip";
export const THROTTLER_LIMIT = "throttler_limit";
export const THROTTLER_TTL = "throttler_ttl";

/**
 * Skip throttling for this route
 */
export const SkipThrottle = (skip = true) => SetMetadata(THROTTLER_SKIP, skip);

/**
 * Set custom throttling limit for this route
 * @param limit - Number of requests allowed
 */
export const ThrottleLimit = (limit: number) =>
  SetMetadata(THROTTLER_LIMIT, limit);

/**
 * Set custom throttling TTL for this route
 * @param ttl - Time window in seconds
 */
export const ThrottleTTL = (ttl: number) => SetMetadata(THROTTLER_TTL, ttl);

/**
 * Apply strict rate limiting (lower limits)
 */
export const StrictThrottle = () => SetMetadata(THROTTLER_LIMIT, 10);

/**
 * Apply relaxed rate limiting (higher limits)
 */
export const RelaxedThrottle = () => SetMetadata(THROTTLER_LIMIT, 200);
