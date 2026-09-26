// backend/src/modules/rider/dashboard/rider.dashboard.routes.js (do not remove this comment)
import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import { handleGetDashboard } from "./rider.dashboard.controller.js";

const router = Router();

router.get("/dashboard", riderAuth, handleGetDashboard);

export default router;