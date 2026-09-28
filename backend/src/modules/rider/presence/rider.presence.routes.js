// backend/src/modules/rider/presence/rider.presence.routes.js (do not remove this comment)
import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import {
  handleUpdateLocation,
  handleToggleAvailability,
  getOnlineStatus,
} from "./rider.presence.controller.js";

const router = Router();

router.get("/status", riderAuth,getOnlineStatus);
router.post("/location", riderAuth, handleUpdateLocation);
router.put("/availability", riderAuth, handleToggleAvailability);

export default router;