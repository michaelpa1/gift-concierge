function readPositiveInt(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === "") {
    return fallback;
  }

  const value = Number.parseInt(String(raw), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getOpenAIApiKey() {
  return String(process.env.OPENAI_API_KEY || "").trim();
}

export const config = {
  get port() {
    return readPositiveInt("PORT", 10000);
  },
  get openaiApiKey() {
    return getOpenAIApiKey();
  },
  get openaiModel() {
    return String(process.env.OPENAI_MODEL || "gpt-5.6-luna").trim();
  },
  openaiTimeoutMs: readPositiveInt("OPENAI_TIMEOUT_MS", 90_000),
  openaiMaxRetries: readPositiveInt("OPENAI_MAX_RETRIES", 1),
  get allowedOrigin() {
    return String(process.env.ALLOWED_ORIGIN || "").trim();
  },
  rateLimitPerIp: readPositiveInt("RATE_LIMIT_PER_IP", 6),
  rateLimitPerIpWindowMs: readPositiveInt(
    "RATE_LIMIT_PER_IP_WINDOW_MS",
    10 * 60 * 1000
  ),
  rateLimitGlobal: readPositiveInt("RATE_LIMIT_GLOBAL", 60),
  rateLimitGlobalWindowMs: readPositiveInt(
    "RATE_LIMIT_GLOBAL_WINDOW_MS",
    60 * 60 * 1000
  ),
  jsonBodyLimit: "16kb",
  fieldLimits: {
    demographic: 500,
    occasion: 120,
    budget: 40,
    country: 60,
  },
  productLimits: {
    title: 140,
    retailer: 80,
    why: 350,
    price_note: 80,
    url: 600,
    maxProducts: 5,
  },
};

export function isGiftSearchConfigured() {
  return Boolean(getOpenAIApiKey());
}
