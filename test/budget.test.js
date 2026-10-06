import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseBudget } from "../src/budget.js";

describe("parseBudget", () => {
  it("parses a range", () => {
    assert.deepEqual(parseBudget("$80–$120"), {
      min: 80,
      max: 120,
      raw: "$80–$120",
    });
  });

  it("treats under as a maximum", () => {
    assert.deepEqual(parseBudget("under 50"), {
      min: null,
      max: 50,
      raw: "under 50",
    });
  });

  it("treats over as a minimum", () => {
    assert.deepEqual(parseBudget("over 100"), {
      min: 100,
      max: null,
      raw: "over 100",
    });
  });

  it("treats a plain number as a maximum", () => {
    assert.deepEqual(parseBudget("75"), {
      min: null,
      max: 75,
      raw: "75",
    });
  });

  it("handles empty input", () => {
    assert.deepEqual(parseBudget(""), {
      min: null,
      max: null,
      raw: null,
    });
  });
});
