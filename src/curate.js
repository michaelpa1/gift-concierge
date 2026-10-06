import { config, isGiftSearchConfigured } from "./config.js";
import { buildGiftPrompt } from "./prompt.js";
import { getOpenAIClient } from "./openai.js";
import { buildProductLink } from "./links.js";

export function extractJsonObject(rawText) {
  const cleaned = String(rawText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI returned non-JSON.");
    }

    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export function cleanProducts(parsed) {
  if (!parsed || !Array.isArray(parsed.products)) {
    throw new Error("AI JSON missing products array.");
  }

  return parsed.products
    .slice(0, config.productLimits.maxProducts)
    .map((product) => {
      const title = String(product?.title || "")
        .trim()
        .slice(0, config.productLimits.title);

      if (!title) {
        return null;
      }

      const retailer = String(product?.retailer || "")
        .trim()
        .slice(0, config.productLimits.retailer);

      const why = String(product?.why || "")
        .trim()
        .slice(0, config.productLimits.why);

      const price_note = String(product?.price_note || "")
        .trim()
        .slice(0, config.productLimits.price_note);

      const normalUrl = String(product?.url || "").trim();
      const link = buildProductLink({
        title,
        retailer,
        url: normalUrl,
      });

      return {
        title,
        retailer,
        why,
        price_note,
        links: link ? [link] : [],
      };
    })
    .filter(Boolean);
}

export async function curateGifts({
  demographic,
  occasion,
  budget,
  country,
}) {
  if (!isGiftSearchConfigured()) {
    const error = new Error("Gift search is not configured yet.");
    error.status = 503;
    throw error;
  }

  const client = getOpenAIClient();
  const destination = String(country || "Australia").trim() || "Australia";
  const prompt = buildGiftPrompt(
    demographic,
    occasion,
    budget,
    destination
  );

  const response = await client.responses.create({
    model: config.openaiModel,
    tools: [
      {
        type: "web_search",
      },
    ],
    input: prompt,
    max_output_tokens: 2500,
  });

  const parsed = extractJsonObject(response.output_text || "");
  return {
    products: cleanProducts(parsed),
  };
}
