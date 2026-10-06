import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanProducts, extractJsonObject } from "../src/curate.js";
import { validateCurateInput } from "../src/validate.js";

describe("JSON recovery and cleaning", () => {
  it("lifts JSON out of surrounding text", () => {
    const parsed = extractJsonObject(`
Here you go:
\`\`\`json
{"products":[{"title":"Hat","retailer":"Shop","why":"Nice","price_note":"$40","url":"https://example.com/hat"}]}
\`\`\`
Thanks!
`);

    assert.equal(parsed.products[0].title, "Hat");
  });

  it("rejects missing products arrays", () => {
    assert.throws(() => cleanProducts({}), /missing products array/);
  });

  it("drops empty titles and keeps length limits", () => {
    const products = cleanProducts({
      products: [
        {
          title: "",
          retailer: "Shop",
          why: "Nope",
          price_note: "$1",
          url: "https://example.com",
        },
        {
          title: "A".repeat(200),
          retailer: "B".repeat(100),
          why: "C".repeat(400),
          price_note: "D".repeat(100),
          url: "https://example.com/item",
        },
      ],
    });

    assert.equal(products.length, 1);
    assert.equal(products[0].title.length, 140);
    assert.equal(products[0].retailer.length, 80);
    assert.equal(products[0].why.length, 350);
    assert.equal(products[0].price_note.length, 80);
  });
});

describe("request validation", () => {
  it("requires the main fields", () => {
    const result = validateCurateInput({
      demographic: "sister",
      occasion: "",
      budget: "50",
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
  });

  it("rejects non-string fields", () => {
    const result = validateCurateInput({
      demographic: { name: "sister" },
      occasion: "birthday",
      budget: "50",
      country: "Australia",
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
  });

  it("rejects oversized fields", () => {
    const result = validateCurateInput({
      demographic: "sister",
      occasion: "birthday",
      budget: "x".repeat(41),
      country: "Australia",
    });

    assert.equal(result.ok, false);
    assert.equal(result.error, "One of the fields is too long.");
  });

  it("defaults a missing country to Australia", () => {
    const result = validateCurateInput({
      demographic: "sister",
      occasion: "birthday",
      budget: "50",
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.country, "Australia");
  });
});
