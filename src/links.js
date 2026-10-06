import {
  AFFILIATES,
  detectAffiliateBrand,
  getAffiliateDomains,
} from "./affiliates.js";
import { config } from "./config.js";

const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_PATTERN = /^\[?[0-9a-f:]+\]?$/i;

function hostnameLooksLikeIp(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "");
  return IPV4_PATTERN.test(host) || IPV6_PATTERN.test(host);
}

export function sanitizeHttpsUrl(raw, maxLength = config.productLimits.url) {
  const value = String(raw || "").trim();
  if (!value.startsWith("https://")) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") {
    return null;
  }

  if (parsed.username || parsed.password) {
    return null;
  }

  if (!parsed.hostname || hostnameLooksLikeIp(parsed.hostname)) {
    return null;
  }

  const cleaned = parsed.toString();
  return cleaned.slice(0, maxLength);
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function domainMatchesPartner(productHost, partnerDomains) {
  if (!productHost) {
    return false;
  }

  return partnerDomains.some(
    (domain) =>
      productHost === domain || productHost.endsWith(`.${domain}`)
  );
}

export function buildTrackedAffiliateUrl(affiliateUrl, productUrl) {
  let tracked;
  let product;

  try {
    tracked = new URL(affiliateUrl);
    product = new URL(productUrl);
  } catch {
    return affiliateUrl;
  }

  if (product.protocol !== "https:") {
    return affiliateUrl;
  }

  if (tracked.hostname.includes("awin1.com")) {
    tracked.searchParams.set("ued", product.toString());
    return tracked.toString();
  }

  if (tracked.hostname.includes("cfjump.com")) {
    tracked.searchParams.set("Url", product.toString());
    return tracked.toString();
  }

  return affiliateUrl;
}

export function buildProductLink({
  title = "",
  retailer = "",
  url = "",
}) {
  const safeUrl = sanitizeHttpsUrl(url);
  const brandKey = detectAffiliateBrand({
    title,
    retailer,
    url: safeUrl || "",
  });

  if (brandKey) {
    const affiliate = AFFILIATES[brandKey];
    if (affiliate?.affiliate) {
      const partnerDomains = getAffiliateDomains(affiliate);
      const productHost = hostnameFromUrl(safeUrl || "");
      const canDeepLink =
        Boolean(safeUrl) &&
        domainMatchesPartner(productHost, partnerDomains);

      const trackedUrl = canDeepLink
        ? buildTrackedAffiliateUrl(affiliate.affiliate, safeUrl)
        : affiliate.affiliate;

      return {
        label: affiliate.brand,
        url: trackedUrl.slice(0, config.productLimits.url),
        affiliate: true,
      };
    }
  }

  if (!safeUrl) {
    return null;
  }

  return {
    label: retailer || "Shop now",
    url: safeUrl,
    affiliate: false,
  };
}
