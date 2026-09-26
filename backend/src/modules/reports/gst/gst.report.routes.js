// backend/src/modules/reports/gst/gst.report.routes.js (do not remove this comment)
// backend/src/modules/reports/gst/gst.report.routes.js

import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import {
  getGstr1Report,
  getGstr2Report,
  getGstr3bSummary,
} from "./gst.report.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/gstr1", getGstr1Report);
router.get("/gstr2", getGstr2Report);
router.get("/gstr3b", getGstr3bSummary);

export default router;