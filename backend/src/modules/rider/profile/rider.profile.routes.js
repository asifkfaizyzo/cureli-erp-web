// backend/src/modules/rider/profile/rider.profile.routes.js

import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import { getDocuments } from "./rider.profile.controller.js";

const router = Router();

router.get("/documents", riderAuth, getDocuments);

export default router;