import { config } from "./config.js";

const FIELD_NAMES = ["demographic", "occasion", "budget", "country"];

export function validateCurateInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      status: 400,
      error: "Missing fields in request.",
    };
  }

  for (const name of FIELD_NAMES) {
    if (body[name] != null && typeof body[name] !== "string") {
      return {
        ok: false,
        status: 400,
        error: "Missing fields in request.",
      };
    }
  }

  const demographic = String(body.demographic || "").trim();
  const occasion = String(body.occasion || "").trim();
  const budget = String(body.budget || "").trim();
  const countryRaw = String(body.country || "").trim();

  if (!demographic || !occasion || !budget) {
    return {
      ok: false,
      status: 400,
      error: "Missing fields in request.",
    };
  }

  if (demographic.length > config.fieldLimits.demographic) {
    return {
      ok: false,
      status: 400,
      error: "One of the fields is too long.",
    };
  }

  if (occasion.length > config.fieldLimits.occasion) {
    return {
      ok: false,
      status: 400,
      error: "One of the fields is too long.",
    };
  }

  if (budget.length > config.fieldLimits.budget) {
    return {
      ok: false,
      status: 400,
      error: "One of the fields is too long.",
    };
  }

  if (countryRaw.length > config.fieldLimits.country) {
    return {
      ok: false,
      status: 400,
      error: "One of the fields is too long.",
    };
  }

  return {
    ok: true,
    value: {
      demographic,
      occasion,
      budget,
      country: countryRaw || "Australia",
    },
  };
}
