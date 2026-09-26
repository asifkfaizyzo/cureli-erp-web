// backend/src/modules/mobile/support/mobile.support.routes.js (do not remove this comment)
import { Router } from "express";
import multer from "multer";
import { mobileAuth as authenticateMobileUser } from "../../../middleware/mobile.auth.js";
import * as controller from "./mobile.support.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5,                  // Max 5 images
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

const router = Router();

router.use(authenticateMobileUser);

router.post("/tickets", upload.array("files", 5), controller.createTicketHandler);
router.get("/tickets", controller.getMyTicketsHandler);
router.get("/tickets/:id", controller.getTicketDetailHandler);
router.post("/tickets/:id/reply", controller.replyTicketHandler);

export default router;