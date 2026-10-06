import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

describe("POST /curate safety", () => {
  let server;
  let baseUrl;
  const previousKey = process.env.OPENAI_API_KEY;

  before(async () => {
    delete process.env.OPENAI_API_KEY;
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (previousKey == null) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousKey;
    }

    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("returns 503 when the API key is missing", async () => {
    const response = await fetch(`${baseUrl}/curate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demographic: "my sister",
        occasion: "birthday",
        budget: "80",
        country: "Australia",
      }),
    });

    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error, "Gift search is not configured yet.");
  });

  it("returns 400 for missing fields", async () => {
    const response = await fetch(`${baseUrl}/curate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demographic: "my sister",
        budget: "80",
      }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, "Missing fields in request.");
  });

  it("serves the homepage without an API key", async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Gift Lane/);
  });
});
