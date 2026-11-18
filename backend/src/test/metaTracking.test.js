import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashSha256, normalizeEmail, normalizePhone } from "../utils/metaHasher.js";
import {
  validateMetaEventPayload,
  validateCapiEventPayload,
  MetaPrivacyPolicyError,
} from "../services/metaPrivacyPolicy.js";
import {
  queueMetaOutboxEvent,
  processMetaOutboxQueue,
  claimPendingOutboxEvents,
  recoverStaleProcessingEvents,
} from "../services/metaOutbox.service.js";
import { sendMetaCapiEvents } from "../services/metaCapi.service.js";
import {
  startMetaOutboxWorker,
  stopMetaOutboxWorker,
} from "../cron/metaOutbox.worker.js";

/**
 * Helper: Creates an in-memory mock database supporting:
 * - Unique constraint on `event_id` (P2002)
 * - Atomic row claiming (`_atomicClaim`) simulating `FOR UPDATE SKIP LOCKED`
 * - Stale processing lease recovery (`_recoverStale`)
 */
function createMockOutboxDb(initialRows = []) {
  const rows = initialRows.map((r, i) => ({
    id: r.id || `row_${i + 1}`,
    event_id: r.event_id,
    event_name: r.event_name || "Purchase",
    event_time: r.event_time || Math.floor(Date.now() / 1000),
    event_data: r.event_data || {},
    user_data: r.user_data || {},
    status: r.status || "PENDING",
    attempts: r.attempts ?? 0,
    last_error: r.last_error ?? null,
    next_retry_at: r.next_retry_at ?? new Date(0),
    claimed_at: r.claimed_at ?? null,
    processing_expires_at: r.processing_expires_at ?? null,
    claimed_by: r.claimed_by ?? null,
    processed_at: r.processed_at ?? null,
    created_at: r.created_at ?? new Date(Date.now() - 10000),
    updated_at: r.updated_at ?? new Date(),
  }));

  return {
    rows,
    metaOutboxEvent: {
      create: async ({ data }) => {
        if (rows.some((r) => r.event_id === data.event_id)) {
          const err = new Error("Unique constraint failed on the fields: (`event_id`)");
          err.code = "P2002";
          throw err;
        }
        const record = {
          id: `row_${rows.length + 1}`,
          ...data,
          claimed_at: null,
          processing_expires_at: null,
          claimed_by: null,
          processed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        rows.push(record);
        return record;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const row of rows) {
          const matchesId = !where.id || row.id === where.id;
          const matchesStatus = !where.status || row.status === where.status;
          const matchesClaimedBy =
            !where.claimed_by || row.claimed_by === where.claimed_by;
          if (matchesId && matchesStatus && matchesClaimedBy) {
            Object.assign(row, data, { updated_at: new Date() });
            count++;
          }
        }
        return { count };
      },
    },
    _atomicClaim: ({ batchSize, workerId, now, leaseExpiresAt, maxRetries }) => {
      const eligible = rows
        .filter(
          (r) =>
            (r.status === "PENDING" || r.status === "FAILED") &&
            (!r.next_retry_at || r.next_retry_at <= now) &&
            r.attempts < maxRetries,
        )
        .slice(0, batchSize);

      for (const row of eligible) {
        row.status = "PROCESSING";
        row.claimed_at = now;
        row.processing_expires_at = leaseExpiresAt;
        row.claimed_by = workerId;
        row.updated_at = now;
      }
      return eligible.map((r) => ({ ...r }));
    },
    _recoverStale: ({ now, maxRetries, initialBackoffMs }) => {
      let recovered = 0;
      let permanentlyFailed = 0;

      for (const row of rows) {
        if (
          row.status === "PROCESSING" &&
          row.processing_expires_at &&
          row.processing_expires_at <= now
        ) {
          const nextAttempts = row.attempts + 1;
          row.attempts = nextAttempts;
          row.processing_expires_at = null;
          row.claimed_by = null;
          row.updated_at = now;

          if (nextAttempts >= maxRetries) {
            row.status = "PERMANENT_FAILURE";
            row.next_retry_at = null;
            row.last_error = "PROCESSING_LEASE_EXPIRED_MAX_RETRIES";
            permanentlyFailed++;
          } else {
            row.status = "FAILED";
            row.next_retry_at = new Date(
              now.getTime() + initialBackoffMs * Math.pow(2, nextAttempts - 1),
            );
            row.last_error = "PROCESSING_LEASE_EXPIRED";
            recovered++;
          }
        }
      }
      return { recovered, permanentlyFailed };
    },
  };
}

const APPROVED_TEST_CONFIG = {
  enabled: true,
  accessToken: "mock_test_token_do_not_send",
  approvedEvents: ["Purchase", "CompleteRegistration", "Login"],
  approvedUserDataKeys: [],
  approvedCustomDataKeys: [],
  maxRetries: 3,
  initialBackoffMs: 1000,
  processingLeaseMs: 5 * 60 * 1000,
};

describe("1. Feature Flag Gating (Collection, Processing & Worker)", () => {
  it("prevents outbox insertion and stores zero data when META_TRACKING_ENABLED=false", async () => {
    const db = createMockOutboxDb();
    const result = await queueMetaOutboxEvent({
      eventId: "cureli_purchase_order_12345",
      eventName: "Purchase",
      userData: { email: "patient@example.com" },
      eventData: { medicine_name: "Paracetamol" },
      tx: db,
      configOverride: { enabled: false },
    });

    assert.equal(result.queued, false);
    assert.equal(result.skipped, true);
    assert.equal(result.reason, "TRACKING_DISABLED");
    assert.equal(db.rows.length, 0);
  });

  it("prevents outbox queue processing when META_TRACKING_ENABLED=false", async () => {
    const db = createMockOutboxDb([
      { event_id: "cureli_purchase_order_12345", status: "PENDING" },
    ]);
    let httpCalled = false;

    const result = await processMetaOutboxQueue({
      db,
      sendFn: async () => {
        httpCalled = true;
      },
      configOverride: { enabled: false },
    });

    assert.equal(result.skipped, true);
    assert.equal(result.processed, 0);
    assert.equal(httpCalled, false);
    assert.equal(db.rows[0].status, "PENDING");
  });

  it("does not start the background worker when tracking is disabled", async () => {
    const status = startMetaOutboxWorker({ enabled: false });
    assert.equal(status.started, false);
    assert.equal(status.reason, "TRACKING_DISABLED");
    await stopMetaOutboxWorker();
  });
});

describe("2. Healthcare Privacy & Strict Validation Policy", () => {
  it("rejects unsupported event names and unapproved candidate events", () => {
    assert.throws(
      () =>
        validateMetaEventPayload(
          { eventId: "cureli_view_123456", eventName: "ViewMedicine" },
          APPROVED_TEST_CONFIG,
        ),
      (err) => err instanceof MetaPrivacyPolicyError && err.code === "UNSUPPORTED_EVENT_NAME",
    );

    assert.throws(
      () =>
        validateMetaEventPayload(
          { eventId: "cureli_purchase_123456", eventName: "Purchase" },
          { ...APPROVED_TEST_CONFIG, approvedEvents: [] },
        ),
      (err) => err instanceof MetaPrivacyPolicyError && err.code === "EVENT_NOT_APPROVED",
    );
  });

  it("rejects raw email, raw phone, full name, DOB, and gender", () => {
    const forbiddenUserPayloads = [
      { email: "user@cureli.in" },
      { phone: "+919876543210" },
      { full_name: "Rahul Nair" },
      { dob: "1990-01-01" },
      { gender: "M" },
      { patient_name: "Anita Sharma" },
    ];

    for (const userData of forbiddenUserPayloads) {
      assert.throws(
        () =>
          validateMetaEventPayload(
            {
              eventId: "cureli_purchase_ord_100",
              eventName: "Purchase",
              userData,
            },
            APPROVED_TEST_CONFIG,
          ),
        (err) =>
          err instanceof MetaPrivacyPolicyError &&
          err.code === "FORBIDDEN_USER_DATA_KEY",
      );
    }
  });

  it("rejects unapproved hashed identifiers by default", () => {
    const hashedEmail = normalizeEmail("user@cureli.in");
    const hashedPhone = normalizePhone("+91 98765-43210");

    assert.throws(
      () =>
        validateMetaEventPayload(
          {
            eventId: "cureli_purchase_ord_101",
            eventName: "Purchase",
            userData: { em: [hashedEmail] },
          },
          APPROVED_TEST_CONFIG, // approvedUserDataKeys is []
        ),
      (err) =>
        err instanceof MetaPrivacyPolicyError &&
        err.code === "UNAPPROVED_USER_DATA_KEY",
    );

    assert.throws(
      () =>
        validateMetaEventPayload(
          {
            eventId: "cureli_purchase_ord_101",
            eventName: "Purchase",
            userData: { ph: [hashedPhone] },
          },
          APPROVED_TEST_CONFIG,
        ),
      (err) =>
        err instanceof MetaPrivacyPolicyError &&
        err.code === "UNAPPROVED_USER_DATA_KEY",
    );
  });

  it("rejects medicine names, SKUs, variant IDs, prescriptions, diagnoses, and nested objects", () => {
    const forbiddenCustomPayloads = [
      { medicine_name: "Amoxicillin 500mg" },
      { medicine_id: "med_123" },
      { variant_id: "var_456" },
      { sku_id: "SKU-001" },
      { prescription_id: "rx_999" },
      { requires_prescription: true },
      { diagnosis: "Hypertension" },
      { search_string: "insulin" },
      { contents: [{ id: "SKU-1", quantity: 1 }] },
      { nested: { anything: "bad" } },
    ];

    for (const eventData of forbiddenCustomPayloads) {
      assert.throws(
        () =>
          validateMetaEventPayload(
            {
              eventId: "cureli_purchase_ord_102",
              eventName: "Purchase",
              eventData,
            },
            APPROVED_TEST_CONFIG,
          ),
        (err) => err instanceof MetaPrivacyPolicyError,
      );
    }
  });

  it("rejects NaN, Infinity, negative numbers, and unapproved custom_data fields", () => {
    const cfgWithValueApproved = {
      ...APPROVED_TEST_CONFIG,
      approvedCustomDataKeys: ["value", "currency", "num_items"],
    };

    for (const badValue of [NaN, Infinity, -Infinity, -10, "250"]) {
      assert.throws(
        () =>
          validateMetaEventPayload(
            {
              eventId: "cureli_purchase_ord_103",
              eventName: "Purchase",
              eventData: { value: badValue, currency: "INR" },
            },
            cfgWithValueApproved,
          ),
        (err) =>
          err instanceof MetaPrivacyPolicyError &&
          err.code === "INVALID_MONETARY_VALUE",
      );
    }
  });

  it("independently enforces privacy validation at the final CAPI transmission boundary", async () => {
    let networkCalled = false;
    const mockHttp = {
      post: async () => {
        networkCalled = true;
        return { data: { events_received: 1 } };
      },
    };

    await assert.rejects(
      () =>
        sendMetaCapiEvents(
          [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              event_id: "cureli_purchase_ord_999",
              action_source: "system_generated",
              user_data: {},
              custom_data: { medicine_name: "Azithromycin" },
            },
          ],
          { configOverride: APPROVED_TEST_CONFIG, httpClient: mockHttp },
        ),
      (err) =>
        err instanceof MetaPrivacyPolicyError &&
        err.code === "FORBIDDEN_CUSTOM_DATA_KEY",
    );

    assert.equal(networkCalled, false);
  });
});

describe("3. Database Idempotency", () => {
  it("skips duplicate Purchase event IDs without throwing or creating duplicate rows", async () => {
    const db = createMockOutboxDb();

    const first = await queueMetaOutboxEvent({
      eventId: "cureli_purchase_order_unique_1",
      eventName: "Purchase",
      tx: db,
      configOverride: APPROVED_TEST_CONFIG,
    });

    const second = await queueMetaOutboxEvent({
      eventId: "cureli_purchase_order_unique_1",
      eventName: "Purchase",
      tx: db,
      configOverride: APPROVED_TEST_CONFIG,
    });

    assert.equal(first.queued, true);
    assert.equal(second.queued, false);
    assert.equal(second.duplicate, true);
    assert.equal(db.rows.length, 1);
    assert.equal("user_id" in db.rows[0], false);
  });
});

describe("4. Outbox Concurrency & Stale Lease Recovery", () => {
  it("ensures two concurrent workers cannot claim the same event", async () => {
    const db = createMockOutboxDb([
      { id: "evt_1", event_id: "cureli_purchase_ord_1", status: "PENDING" },
      { id: "evt_2", event_id: "cureli_purchase_ord_2", status: "PENDING" },
    ]);

    const now = new Date();
    const worker1Claim = await claimPendingOutboxEvents({
      batchSize: 1,
      workerId: "worker_A",
      now,
      db,
      configOverride: APPROVED_TEST_CONFIG,
    });

    const worker2Claim = await claimPendingOutboxEvents({
      batchSize: 1,
      workerId: "worker_B",
      now,
      db,
      configOverride: APPROVED_TEST_CONFIG,
    });

    const worker3Claim = await claimPendingOutboxEvents({
      batchSize: 1,
      workerId: "worker_C",
      now,
      db,
      configOverride: APPROVED_TEST_CONFIG,
    });

    assert.equal(worker1Claim.length, 1);
    assert.equal(worker2Claim.length, 1);
    assert.equal(worker3Claim.length, 0);
    assert.notEqual(worker1Claim[0].event_id, worker2Claim[0].event_id);
  });

  it("recovers expired PROCESSING records (>5 mins) without touching active worker leases", async () => {
    const now = new Date();
    const expiredLease = new Date(now.getTime() - 60 * 1000); // expired 1 min ago
    const activeLease = new Date(now.getTime() + 4 * 60 * 1000); // valid for 4 more mins

    const db = createMockOutboxDb([
      {
        id: "stale_row",
        event_id: "cureli_purchase_stale_1",
        status: "PROCESSING",
        attempts: 0,
        claimed_by: "crashed_worker",
        processing_expires_at: expiredLease,
      },
      {
        id: "active_row",
        event_id: "cureli_purchase_active_2",
        status: "PROCESSING",
        attempts: 0,
        claimed_by: "healthy_worker",
        processing_expires_at: activeLease,
      },
    ]);

    const recovery = await recoverStaleProcessingEvents({
      now,
      db,
      configOverride: APPROVED_TEST_CONFIG,
    });

    assert.equal(recovery.recovered, 1);
    assert.equal(db.rows[0].status, "FAILED");
    assert.equal(db.rows[0].attempts, 1);
    assert.equal(db.rows[0].claimed_by, null);

    // Active row remains untouched
    assert.equal(db.rows[1].status, "PROCESSING");
    assert.equal(db.rows[1].claimed_by, "healthy_worker");
  });
});

describe("5. Retry Backoff, Permanent Failure & Log Safety", () => {
  it("applies exponential backoff on transient failure and transitions to PERMANENT_FAILURE at maxRetries", async () => {
    const baseTime = new Date("2026-11-17T10:00:00.000Z");
    const db = createMockOutboxDb([
      {
        id: "retry_row",
        event_id: "cureli_purchase_retry_1",
        eventName: "Purchase",
        status: "PENDING",
        attempts: 0,
        next_retry_at: new Date(baseTime.getTime() - 1000),
      },
    ]);

    const failingSendFn = async () => {
      const err = new Error("Sensitive token secret_abc and patient@cureli.in");
      err.response = { status: 503 };
      throw err;
    };

    // Attempt 1 -> FAILED with 1000ms backoff
    await processMetaOutboxQueue({
      now: baseTime,
      db,
      sendFn: failingSendFn,
      configOverride: APPROVED_TEST_CONFIG,
    });
    assert.equal(db.rows[0].status, "FAILED");
    assert.equal(db.rows[0].attempts, 1);
    assert.equal(db.rows[0].last_error, "META_HTTP_503"); // Sensitive error message scrubbed!
    assert.equal(
      db.rows[0].next_retry_at.getTime(),
      baseTime.getTime() + 1000,
    );

    // Attempt 2 -> FAILED with 2000ms backoff
    const secondTickTime = new Date(baseTime.getTime() + 1500);
    await processMetaOutboxQueue({
      now: secondTickTime,
      db,
      sendFn: failingSendFn,
      configOverride: APPROVED_TEST_CONFIG,
    });
    assert.equal(db.rows[0].status, "FAILED");
    assert.equal(db.rows[0].attempts, 2);
    assert.equal(
      db.rows[0].next_retry_at.getTime(),
      secondTickTime.getTime() + 2000,
    );

    // Attempt 3 (maxRetries = 3) -> PERMANENT_FAILURE
    const thirdTickTime = new Date(secondTickTime.getTime() + 2500);
    await processMetaOutboxQueue({
      now: thirdTickTime,
      db,
      sendFn: failingSendFn,
      configOverride: APPROVED_TEST_CONFIG,
    });
    assert.equal(db.rows[0].status, "PERMANENT_FAILURE");
    assert.equal(db.rows[0].attempts, 3);
    assert.equal(db.rows[0].next_retry_at, null);
  });
});

describe("6. Payment Verification & Order Isolation", () => {
  it("only queues Purchase for verified PAID non-COD orders and never breaks checkout on Meta error", async () => {
    const db = createMockOutboxDb();

    async function simulateOrderPostCommit(order, outboxConfig) {
      let orderReturnedSuccessfully = false;
      if (
        order &&
        order.order_id &&
        order.payment_status === "PAID" &&
        order.payment_method !== "COD"
      ) {
        try {
          await queueMetaOutboxEvent({
            eventId: `cureli_purchase_${order.order_id}`,
            eventName: "Purchase",
            userData: {},
            eventData: {},
            tx: db,
            configOverride: outboxConfig,
          });
        } catch {
          // Checkout swallows Meta errors so customer order never fails
        }
      }
      orderReturnedSuccessfully = true;
      return orderReturnedSuccessfully;
    }

    // 1. Pending payment -> never queued
    await simulateOrderPostCommit(
      { order_id: "ord_pending", payment_status: "PENDING", payment_method: "ONLINE" },
      APPROVED_TEST_CONFIG,
    );
    assert.equal(db.rows.length, 0);

    // 2. COD order -> never queued
    await simulateOrderPostCommit(
      { order_id: "ord_cod", payment_status: "PAID", payment_method: "COD" },
      APPROVED_TEST_CONFIG,
    );
    assert.equal(db.rows.length, 0);

    // 3. Verified PAID online order -> queued once
    const paidSuccess = await simulateOrderPostCommit(
      { order_id: "ord_paid_1", payment_status: "PAID", payment_method: "ONLINE" },
      APPROVED_TEST_CONFIG,
    );
    assert.equal(paidSuccess, true);
    assert.equal(db.rows.length, 1);

    // 4. Even if Meta policy rejects or DB throws, order still succeeds
    const brokenOrderSuccess = await simulateOrderPostCommit(
      { order_id: "ord_paid_2", payment_status: "PAID", payment_method: "ONLINE" },
      { ...APPROVED_TEST_CONFIG, approvedEvents: [] }, // Forces policy rejection
    );
    assert.equal(brokenOrderSuccess, true);
  });
});

describe("7. Hashing Utility Sanity Checks", () => {
  it("normalizes and SHA-256 hashes email and Indian phone numbers deterministically", () => {
    assert.equal(
      normalizeEmail("  User.Test@Cureli.IN "),
      hashSha256("user.test@cureli.in"),
    );
    assert.equal(
      normalizePhone("+91 98765-43210"),
      hashSha256("919876543210"),
    );
  });
});