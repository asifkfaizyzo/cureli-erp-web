// backend/src/middleware/validate.js

import { fail } from "../utils/response.js";

/**
 * Universal validation middleware for Express + Zod
 * Supports body, query, and params validation
 *
 * @param {import("zod").ZodSchema} schema - Zod Schema to validate against
 * @param {"body" | "query" | "params"} [source="body"] - Target request property
 */
export const validate = (schema, source = "body") => (req, res, next) => {
  try {
    const rawData = req[source] || {};
    const parsed = schema.parse(rawData);

    if (source === "body") {
      req.body = parsed;
      req.validated = parsed;
    } else if (source === "query") {
      try {
        req.query = parsed;
      } catch {
        Object.assign(req.query, parsed);
      }
      req.validatedQuery = parsed;
      req.validated = { ...(req.validated || {}), ...parsed };
    } else if (source === "params") {
      try {
        req.params = parsed;
      } catch {
        Object.assign(req.params, parsed);
      }
      req.validatedParams = parsed;
      req.validated = { ...(req.validated || {}), ...parsed };
    }

    return next();
  } catch (err) {
    const message = err?.errors?.[0]?.message || "Validation failed";
    return fail(res, message, 400, err?.errors || err);
  }
};

export const validateBody = (schema) => validate(schema, "body");
export const validateQuery = (schema) => validate(schema, "query");
export const validateParams = (schema) => validate(schema, "params");