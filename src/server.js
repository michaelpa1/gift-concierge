import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { config, isGiftSearchConfigured } from "./config.js";
import { createRateLimiter } from "./rateLimit.js";
import { validateCurateInput } from "./validate.js";
import { curateGifts } from "./curate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  if (config.allowedOrigin) {
    app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", config.allowedOrigin);
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }

      return next();
    });
  }

  app.use(express.static(publicDir));
  app.use(express.json({ limit: config.jsonBodyLimit }));

  const rateLimit = createRateLimiter({
    perIpLimit: config.rateLimitPerIp,
    perIpWindowMs: config.rateLimitPerIpWindowMs,
    globalLimit: config.rateLimitGlobal,
    globalWindowMs: config.rateLimitGlobalWindowMs,
  });

  app.post("/curate", rateLimit, async (req, res) => {
    const startedAt = Date.now();

    try {
      const validation = validateCurateInput(req.body);
      if (!validation.ok) {
        console.error(
          JSON.stringify({
            event: "curate_rejected",
            status: validation.status,
            durationMs: Date.now() - startedAt,
          })
        );
        return res.status(validation.status).json({
          error: validation.error,
        });
      }

      if (!isGiftSearchConfigured()) {
        console.error(
          JSON.stringify({
            event: "curate_unconfigured",
            status: 503,
            durationMs: Date.now() - startedAt,
          })
        );
        return res.status(503).json({
          error: "Gift search is not configured yet.",
        });
      }

      const result = await curateGifts(validation.value);

      console.log(
        JSON.stringify({
          event: "curate_ok",
          status: 200,
          productCount: result.products.length,
          durationMs: Date.now() - startedAt,
        })
      );

      return res.json(result);
    } catch (err) {
      const status = err?.status || 500;
      const knownClientErrors = new Set([
        "AI returned non-JSON.",
        "AI JSON missing products array.",
      ]);

      let message = "Something went wrong curating gifts.";
      if (status === 503) {
        message = "Gift search is not configured yet.";
      } else if (knownClientErrors.has(err?.message)) {
        message =
          err.message === "AI returned non-JSON."
            ? "AI returned non-JSON. Try again."
            : err.message;
      }

      console.error(
        JSON.stringify({
          event: "curate_error",
          status,
          durationMs: Date.now() - startedAt,
          code: err?.code || null,
          name: err?.name || "Error",
        })
      );

      return res.status(status >= 400 && status < 600 ? status : 500).json({
        error: message,
      });
    }
  });

  app.use((err, req, res, next) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({
        error: "Request is too large.",
      });
    }

    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({
        error: "Missing fields in request.",
      });
    }

    console.error(
      JSON.stringify({
        event: "unhandled_error",
        status: 500,
        name: err?.name || "Error",
      })
    );

    return res.status(500).json({
      error: "Something went wrong curating gifts.",
    });
  });

  return app;
}

export function startServer() {
  const app = createApp();
  const port = config.port;

  return app.listen(port, () => {
    console.log(`Gift Lane server running on port ${port}`);
  });
}
