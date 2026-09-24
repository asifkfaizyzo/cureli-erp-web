// backend/src/modules/rider/presence/rider.presence.service.js (do not remove this comment)
import prisma from "../../../config/prisma.js";

// ── Constants ────────────────────────────────────────────────
const MIN_LOCATION_INTERVAL_MS = 5 * 1000; // 5 seconds between uploads
const MAX_ACCURACY_METERS = 100; // reject GPS fixes worse than 100m
const MAX_SPEED_KMH = 200; // reject if implied speed > 200 km/h
const EARTH_RADIUS_KM = 6371;

// ── Helpers ──────────────────────────────────────────────────

/**
 * Haversine distance between two lat/lng points in km.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns the 6AM–6AM shift date for the current IST time.
 * If before 6AM IST, the shift belongs to yesterday.
 * Mirrors getShiftWindowForDate() from incentiveEngine.service.js.
 */
function getCurrentShiftDate(now = new Date()) {
  // Use the same local-time approach as the incentive engine
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const hour = now.getHours();

  const shiftDate = new Date(year, month, date);
  if (hour < 6) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }
  return new Date(
    Date.UTC(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate()),
  );
}

// ── Active delivery statuses that block going offline ────────
const ACTIVE_DELIVERY_STATUSES = [
  "RIDER_NOTIFIED",
  "ACCEPTED",
  "ARRIVED_AT_PHARMACY",
  "PHARMACY_CONFIRMED",
  "PICKED_UP",
  "EN_ROUTE",
  "ARRIVED_AT_CUSTOMER",
];

// ── updateLocation ───────────────────────────────────────────

export async function updateLocation(riderId, data) {
  const { lat, lng, accuracy, speed } = data;

  // 1. Accuracy gate (if provided)
  if (accuracy != null && accuracy > MAX_ACCURACY_METERS) {
    const err = new Error("GPS accuracy too low. Please wait for a better fix.");
    err.code = "LOW_ACCURACY";
    throw err;
  }

  // 2. Fetch current rider state for rate-limit and speed check
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      current_lat: true,
      current_lng: true,
      last_location_at: true,
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // 3. Rate limit: reject if last upload was < 5 seconds ago
  if (rider.last_location_at) {
    const elapsed = Date.now() - new Date(rider.last_location_at).getTime();
    if (elapsed < MIN_LOCATION_INTERVAL_MS) {
      const err = new Error("Too frequent. Please wait.");
      err.code = "RATE_LIMITED";
      throw err;
    }
  }

  // 4. Speed sanity check (if we have a previous location)
  if (rider.current_lat != null && rider.current_lng != null && rider.last_location_at) {
    const prevLat = Number(rider.current_lat);
    const prevLng = Number(rider.current_lng);
    const timeDiffMs = Date.now() - new Date(rider.last_location_at).getTime();

    if (timeDiffMs > 0) {
      const distKm = haversineKm(prevLat, prevLng, lat, lng);
      const timeHours = timeDiffMs / 3_600_000;
      const impliedSpeed = distKm / timeHours;

      if (impliedSpeed > MAX_SPEED_KMH) {
        const err = new Error("Location update rejected: unrealistic speed.");
        err.code = "SPEED_ANOMALY";
        throw err;
      }
    }
  }

  // 5. Update rider telemetry
  await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      current_lat: lat,
      current_lng: lng,
      last_location_at: new Date(),
      last_seen_at: new Date(),
    },
  });
}

// ── toggleAvailability ───────────────────────────────────────

export async function toggleAvailability(riderId, data) {
  const { is_online, lat, lng } = data;

  // Fetch full rider for state checks
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      status: true,
      is_online: true,
      documents: {
        select: { status: true },
      },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // ── TOGGLE ONLINE ──────────────────────────────────────────
  if (is_online) {
    // Already online — idempotent, just update location
    if (rider.is_online) {
      if (lat != null && lng != null) {
        await prisma.rider.update({
          where: { rider_id: riderId },
          data: {
            current_lat: lat,
            current_lng: lng,
            last_location_at: new Date(),
            last_seen_at: new Date(),
          },
        });
      }
      return { is_online: true, already_online: true };
    }

    // Status check: only ACTIVE riders can go online
    if (rider.status !== "ACTIVE") {
      const err = new Error(
        rider.status === "PENDING_REVIEW"
          ? "Your account is pending approval. You cannot go online yet."
          : rider.status === "DRAFT"
            ? "Please complete onboarding before going online."
            : `Your account is ${rider.status.toLowerCase()}. Please contact support.`,
      );
      err.code = "NOT_APPROVED";
      throw err;
    }

    // Document check: all 5 docs must be APPROVED
    const approvedDocs = rider.documents.filter((d) => d.status === "APPROVED");
    if (approvedDocs.length < 5) {
      const err = new Error(
        "All documents must be approved before going online.",
      );
      err.code = "DOCS_INCOMPLETE";
      throw err;
    }

    // Go online + create session
    const now = new Date();
    const shiftDate = getCurrentShiftDate(now);

    await prisma.$transaction(async (tx) => {
      // Update rider telemetry + online flag
      await tx.rider.update({
        where: { rider_id: riderId },
        data: {
          is_online: true,
          current_lat: lat,
          current_lng: lng,
          last_location_at: now,
          last_seen_at: now,
        },
      });

      // Check for existing open session (safety — shouldn't happen but handle it)
      const openSession = await tx.riderOnlineSession.findFirst({
        where: { rider_id: riderId, went_offline_at: null },
      });

      if (!openSession) {
        await tx.riderOnlineSession.create({
          data: {
            rider_id: riderId,
            went_online_at: now,
            shift_date: shiftDate,
          },
        });
      }
    });

    return { is_online: true };
  }

  // ── TOGGLE OFFLINE ─────────────────────────────────────────
  if (!is_online) {
    // Already offline — idempotent
    if (!rider.is_online) {
      return { is_online: false, already_offline: true };
    }

    // Active delivery guard
    const activeDelivery = await prisma.delivery.findFirst({
      where: {
        rider_id: riderId,
        status: { in: ACTIVE_DELIVERY_STATUSES },
      },
      select: { delivery_id: true, status: true },
      orderBy: { created_at: "desc" },
    });

    if (activeDelivery) {
      const err = new Error(
        "Cannot go offline during an active delivery. Please complete or cancel the delivery first.",
      );
      err.code = "ACTIVE_DELIVERY";
      err.active_delivery_id = activeDelivery.delivery_id;
      err.delivery_status = activeDelivery.status;
      throw err;
    }

    // Go offline + close session
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.rider.update({
        where: { rider_id: riderId },
        data: {
          is_online: false,
          last_seen_at: now,
        },
      });

      // Close all open sessions for this rider
      const openSessions = await tx.riderOnlineSession.findMany({
        where: { rider_id: riderId, went_offline_at: null },
        select: { session_id: true, went_online_at: true },
      });

      for (const session of openSessions) {
        const durationMs = now.getTime() - new Date(session.went_online_at).getTime();
        const durationMinutes = Math.round((durationMs / 60_000) * 100) / 100;

        await tx.riderOnlineSession.update({
          where: { session_id: session.session_id },
          data: {
            went_offline_at: now,
            duration_minutes: durationMinutes,
            closed_by: "rider",
          },
        });
      }
    });

    return { is_online: false };
  }
}