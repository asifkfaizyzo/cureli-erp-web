// backend/src/modules/mobile/app-config/mobile.appConfig.routes.js (do not remove this comment)
// src/modules/mobile/app-config/mobile.appConfig.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import {
  handleGetMarketplaceDisplay,
  handleGetHomeBanners,
  handleGetHomeScreenConfig,
} from "./mobile.appConfig.controller.js";

const router = Router();

router.get("/marketplace-display", mobileAuth, handleGetMarketplaceDisplay);
router.get("/home-banners", mobileAuth, handleGetHomeBanners);
router.get("/home-screen", mobileAuth, handleGetHomeScreenConfig);
export default router;
