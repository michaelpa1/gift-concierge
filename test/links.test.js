import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectAffiliateBrand } from "../src/affiliates.js";
import {
  buildProductLink,
  buildTrackedAffiliateUrl,
  sanitizeHttpsUrl,
} from "../src/links.js";

describe("affiliate matching and links", () => {
  it("matches from retailer and title without using the explanation", () => {
    assert.equal(
      detectAffiliateBrand({
        title: "Classic Bucket Hat",
        retailer: "Will & Bear",
        url: "https://willandbear.com.au/products/hat",
      }),
      "Will & Bear"
    );
  });

  it("does not match a short risky token alone", () => {
    assert.equal(
      detectAffiliateBrand({
        title: "Gift for YCZ fan of puzzles",
        retailer: "Example Store",
        url: "https://example.com/item",
      }),
      null
    );
  });

  it("rejects unsafe urls", () => {
    assert.equal(sanitizeHttpsUrl("http://example.com"), null);
    assert.equal(sanitizeHttpsUrl("https://user:pass@example.com"), null);
    assert.equal(sanitizeHttpsUrl("https://127.0.0.1/item"), null);
  });

  it("deep-links when the product domain matches the partner", () => {
    const link = buildProductLink({
      title: "Will & Bear Hat",
      retailer: "Will & Bear",
      url: "https://willandbear.com.au/products/hat",
    });

    assert.equal(link.affiliate, true);
    assert.equal(link.label, "Will & Bear");
    assert.match(link.url, /awin1\.com/);
    assert.match(
      link.url,
      /ued=https%3A%2F%2Fwillandbear\.com\.au%2Fproducts%2Fhat/
    );
  });

  it("falls back to the partner homepage when domains do not match", () => {
    const link = buildProductLink({
      title: "Will & Bear Hat",
      retailer: "Will & Bear",
      url: "https://other-store.example/products/hat",
    });

    assert.equal(link.affiliate, true);
    assert.equal(
      link.url,
      "https://www.awin1.com/cread.php?awinmid=119813&awinaffid=2689862&ued=https%3A%2F%2Fwillandbear.com.au"
    );
  });

  it("keeps a normal product link for non-partners", () => {
    const link = buildProductLink({
      title: "Useful Mug",
      retailer: "Local Shop",
      url: "https://localshop.example/mug",
    });

    assert.deepEqual(link, {
      label: "Local Shop",
      url: "https://localshop.example/mug",
      affiliate: false,
    });
  });

  it("adds a Commission Factory Url parameter for deep links", () => {
    const tracked = buildTrackedAffiliateUrl(
      "https://t.cfjump.com/94542/t/93906",
      "https://foemina.com/products/dress"
    );

    assert.match(
      tracked,
      /Url=https%3A%2F%2Ffoemina\.com%2Fproducts%2Fdress/
    );
  });
});
