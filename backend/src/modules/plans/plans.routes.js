// backend/src/modules/plans/plans.routes.js (do not remove this comment)
// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\plans\plans.routes.js

import express from "express";
import {
  getPlansController,
  getPlanByIdController,
} from "./plans.controller.js";

const router = express.Router();

router.get("/", getPlansController);
router.get("/:id", getPlanByIdController);

export default router;