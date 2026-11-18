// backend/src/test/metaTracking.test.js

import { describe, it } from "node:test";
import assert from "assert";
import { hashSha256, normalizeEmail, normalizePhone } from "../utils/metaHasher.js";
import { queueMetaOutboxEvent } from "../services/metaOutbox.service.js";

describe("Meta Tracking Unit & Safety Tests", () => {
  it("should correctly normalize and SHA-256 hash email", () => {
    const rawEmail = "  User.Test@Cureli.IN ";
    const expected = hashSha256("user.test@cureli.in");
    assert.strictEqual(normalizeEmail(rawEmail), expected);
  });

  it("should normalize Indian phone numbers with country code before hashing", () => {
    const rawPhone = "+91 98765-43210";
    const expected = hashSha256("919876543210");
    assert.strictEqual(normalizePhone(rawPhone), expected);
  });

  it("should guarantee database idempotency for Purchase event_id", async () => {
    const mockTx = {
      metaOutboxEvent: {
        create: async ({ data }) => {
          if (data.event_id === "duplicate_id") {
            const err = new Error("Unique constraint failed");
            err.code = "P2002";
            throw err;
          }
          return { id: "outbox_1", ...data };
        }
      }
    };

    const firstResult = await queueMetaOutboxEvent({
      eventId: "duplicate_id",
      eventName: "Purchase",
      tx: mockTx,
    });

    assert.strictEqual(firstResult, null); // Gracefully handled duplicate without throwing
  });
});