export function createRateLimiter({
  perIpLimit,
  perIpWindowMs,
  globalLimit,
  globalWindowMs,
  now = () => Date.now(),
}) {
  const perIpHits = new Map();
  let globalHits = [];

  function prune(timestamps, windowMs, currentTime) {
    return timestamps.filter((stamp) => currentTime - stamp < windowMs);
  }

  return function rateLimit(req, res, next) {
    const currentTime = now();
    const ip = req.ip || req.socket?.remoteAddress || "unknown";

    globalHits = prune(globalHits, globalWindowMs, currentTime);
    if (globalHits.length >= globalLimit) {
      return res.status(429).json({
        error: "Please wait a moment and try again.",
      });
    }

    const existing = prune(perIpHits.get(ip) || [], perIpWindowMs, currentTime);
    if (existing.length >= perIpLimit) {
      perIpHits.set(ip, existing);
      return res.status(429).json({
        error: "Please wait a moment and try again.",
      });
    }

    existing.push(currentTime);
    perIpHits.set(ip, existing);
    globalHits.push(currentTime);
    return next();
  };
}
