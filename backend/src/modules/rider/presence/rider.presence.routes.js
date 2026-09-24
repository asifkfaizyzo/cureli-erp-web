// backend/src/modules/rider/presence/rider.presence.routes.js (do not remove this comment)
import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import {
  handleUpdateLocation,
  handleToggleAvailability,
} from "./rider.presence.controller.js";

const router = Router();

// All routes require authenticated rider session
router.post("/location", riderAuth, handleUpdateLocation);
router.put("/availability", riderAuth, handleToggleAvailability);

export default router;