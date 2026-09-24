import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import { handleGetNearbyShops } from "./rider.shops.controller.js";

const router = Router();

router.get("/nearby-shops", riderAuth, handleGetNearbyShops);

export default router;