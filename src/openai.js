import OpenAI from "openai";
import { config, isGiftSearchConfigured } from "./config.js";

let client = null;

export function getOpenAIClient() {
  if (!isGiftSearchConfigured()) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: config.openaiApiKey,
      timeout: config.openaiTimeoutMs,
      maxRetries: config.openaiMaxRetries,
    });
  }

  return client;
}

export function resetOpenAIClientForTests() {
  client = null;
}
