import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const otpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'), // 3 requests per 10 minutes per IP/User
  analytics: true,
});

export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 messages per 10 seconds
  analytics: true,
});

