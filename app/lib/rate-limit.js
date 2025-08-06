import { LRUCache } from "lru-cache";

export function rateLimit(options) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500, // Maximum number of tokens to track
    ttl: options.interval || 60000, // Time-to-live (defaults to 1 minute)
  });

  return {
    check: async (request) => {
      // Get IP from request
      const forwarded = request.headers.get("x-forwarded-for")?.split(",");

      const realIp =
        request.headers.get("x-real-ip") ||
        forwarded?.[1] ||
        forwarded?.[0] ||
        "anonymous";

      const ip = realIp.replace("::ffff:", "");

      // if (ip === "127.0.0.1" || ip === "::1") return Promise.resolve();
      console.log("ip: ", ip);
      // Get current count for this IP
      const currentTokenCount = tokenCache.get(ip) || 0;

      // Check if the token count exceeds the limit
      if (currentTokenCount >= options.limit) {
        const error = new Error("Rate limit exceeded");
        error.status = 429;
        throw error;
      }

      // Increment the token count
      tokenCache.set(ip, currentTokenCount + 1);

      return Promise.resolve();
    },
  };
}
