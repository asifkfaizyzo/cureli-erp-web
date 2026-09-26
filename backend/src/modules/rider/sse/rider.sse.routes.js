// backend/src/modules/rider/sse/rider.sse.routes.js (do not remove this comment)
// backend/src/modules/rider/sse/rider.sse.routes.js

import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import { sseService } from "../../../services/sse.service.js";
import prisma from "../../../config/prisma.js";

const router = Router();

router.get("/stream", riderAuth, async (req, res) => {
  const riderId = req.rider.rider_id;

  // SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Nginx: disable buffering
  res.flushHeaders();

  // Register this connection
  sseService.addRiderClient(riderId, res);

  // Send connected confirmation immediately
  res.write(
    sseService.formatSSEMessage("connected", {
      rider_id:  riderId,
      timestamp: new Date().toISOString(),
    })
  );

  // Update last_seen_at
  await prisma.rider.update({
    where: { rider_id: riderId },
    data:  { last_seen_at: new Date() },
  }).catch(() => {});

  // Heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(sseService.formatSSEMessage("ping", { ts: Date.now() }));
    } catch {
      clearInterval(heartbeat);
    }
  }, 30_000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    sseService.removeRiderClient(riderId, res);
  });
});

export default router;