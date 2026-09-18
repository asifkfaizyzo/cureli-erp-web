// index.js

import "./env.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { initializeCronJobs } from "./src/cron/jobs.js";
import { ensureIndexes } from "./src/config/ensureIndexes.js";

// ============================================
// MIDDLEWARE IMPORTS
// ============================================
import maintenanceMiddleware from "./src/middleware/maintenance.js";
import {
  globalLimiter,
  cadminLimiter,
  relaxedLimiter,
  mobileLimiter,
} from "./src/middleware/rateLimiter.js";
import publicUnsubscribeRoutes from "./src/modules/public/unsubscribe/unsubscribe.routes.js";

// ============================================
// ERP ROUTES
// ============================================
import authRoutes from "./src/modules/auth/auth.routes.js";
import shopRoutes from "./src/modules/shop/shop.routes.js";
import pendingRoutes from "./src/modules/pending/pending.routes.js";
import shopFilesRoutes from "./src/modules/shopFiles/shopFiles.routes.js";
import subscriptionRoutes from "./src/modules/subscription/subscription.routes.js";
import plansRoutes from "./src/modules/plans/plans.routes.js";
import setupRoutes from "./src/modules/setup/setup.routes.js";
import branchesRoutes from "./src/modules/branches/branches.routes.js";
import usersRoutes from "./src/modules/users/users.routes.js";
import profileRoutes from "./src/modules/profile/profile.routes.js";
import ticketRoutes from "./src/modules/tickets/tickets.routes.js";
import enquiriesRoutes from "./src/modules/enquiries/enquiries.routes.js";
import maintenanceRoutes from "./src/modules/maintenance/maintenance.routes.js";
import userNotificationRoutes from "./src/modules/notifications/user/userNotifications.routes.js";
import filesRoutes from "./src/modules/files/files.routes.js";
import linkingRoutes from "./src/modules/medicines/linking.routes.js";
import medicineRoutes from "./src/modules/medicines/medicine.routes.js";
import supplierRoutes from "./src/modules/suppliers/supplier.routes.js";
import purchaseRoutes from "./src/modules/purchase/purchase.routes.js";
import inventoryRoutes from "./src/modules/inventory/inventory.routes.js";
import salesRoutes from "./src/modules/sales/sales.routes.js";
import customerRoutes from "./src/modules/customers/customer.routes.js";
import excelRoutes from "./src/modules/excel/excel.routes.js";
import marketplaceRoutes from "./src/modules/marketplace/marketplace.routes.js";
import listingsRoutes from "./src/modules/marketplace-listings/listings.routes.js";
import marketplaceOrdersRoutes from "./src/modules/marketplace-orders/marketplace.orders.routes.js";
import marketplaceDashboardRoutes from "./src/modules/marketplace-dashboard/marketplaceDashboard.routes.js";
import inventoryImportRoutes from "./src/modules/inventory-import/inventoryImport.routes.js";
import prescriptionRequestsMobileRouter from "./src/modules/prescription-requests/prescription.requests.routes.js";
import prescriptionRequestsErpRouter from "./src/modules/prescription-requests/prescription.requests.erp.routes.js";
import salesReportRoutes from "./src/modules/reports/sales/sales.report.routes.js";
import purchaseReportRoutes from "./src/modules/reports/purchase/purchase.report.routes.js";
import inventoryReportRoutes from "./src/modules/reports/inventory/inventory.report.routes.js";
import gstReportRoutes from "./src/modules/reports/gst/gst.report.routes.js";
import financialReportRoutes from "./src/modules/reports/financial/financial.report.routes.js";
import marketplaceReportRoutes from "./src/modules/reports/marketplace/marketplace.report.routes.js";

// ============================================
// CADMIN ROUTES
// ============================================
import cadminAuthRoutes from "./src/modules/cadmin/auth/cadminAuth.routes.js";
import cadminDocsRoutes from "./src/modules/cadmin/cadminDocs/cadminDocs.routes.js";
import cadminUserRoutes from "./src/modules/cadmin/users/cadminUser.routes.js";
import cadminShopsRoutes from "./src/modules/cadmin/shops/cadminShops.routes.js";
import cadminPlansRoutes from "./src/modules/cadmin/plans/cadminPlans.routes.js";
import cadminAdminRoutes from "./src/modules/cadmin/admins/cadminAdmin.routes.js";
import cadminProfileRoutes from "./src/modules/cadmin/profile/cadminProfile.routes.js";
import cadminTicketsRoutes from "./src/modules/cadmin/tickets/cadminTickets.routes.js";
import cadminSubscriptionsRoutes from "./src/modules/cadmin/subscriptions/cadminSubscriptions.routes.js";
import cadminAuditRoutes from "./src/modules/cadmin/audit/cadminAudit.routes.js";
import cadminBroadcastInAppRoutes from "./src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.routes.js";
import cadminNotificationRoutes from "./src/modules/notifications/cadmin/cadminNotifications.routes.js";
import cadminEmailBroadcastRoutes from "./src/modules/cadmin/broadcast/email/cadminEmailBroadcast.routes.js";
import cadminDashboardRoutes from "./src/modules/cadmin/dashboard/cadminDashboard.routes.js";
import cadminMasterMedicinesRoutes from "./src/modules/cadmin/master-medicines/cadminMasterMedicines.routes.js";
import cadminRolesRoutes from "./src/modules/cadmin/roles/cadminRoles.routes.js";
import cadminMarketplaceRoutes from "./src/modules/cadmin/marketplace/cadmin.marketplace.routes.js";
import cadminMobileUsersRoutes from "./src/modules/cadmin/mobile-users/cadminMobileUsers.routes.js";
import cadminMarketplaceOrdersRoutes from "./src/modules/cadmin/marketplace-orders/cadminMarketplaceOrders.routes.js";
import cadminMobileBroadcastRoutes from "./src/modules/cadmin/broadcast/mobile/cadminMobileBroadcast.routes.js";
import cadminPricingRoutes from "./src/modules/cadmin/pricing/cadminPricing.routes.js";
import cadminEnquiriesRoutes from "./src/modules/cadmin/enquiries/cadminEnquiries.routes.js";
import cadminAppConfigRoutes from "./src/modules/cadmin/app-config/cadmin.appConfig.routes.js";
import cadminRiderRoutes from "./src/modules/cadmin/delivery/cadminRiders.routes.js";
import cadminCouponRoutes from "./src/modules/cadmin/coupons/cadminCoupon.routes.js";
import cadminCustomerSupportRoutes from "./src/modules/cadmin/customer-support/cadmin.customerSupport.routes.js";
import cadminMobileEmailBroadcastRoutes from "./src/modules/cadmin/broadcast/mobile-email/cadminMobileEmailBroadcast.routes.js";
// ============================================
// MOBILE ROUTES
// ============================================
import mobileAuthRoutes from "./src/modules/mobile/auth/mobile.auth.routes.js";
import mobileUsersRoutes from "./src/modules/mobile/users/mobile.users.routes.js";
import mobileMedicinesRoutes from "./src/modules/mobile/medicines/mobile.medicines.routes.js";
import mobilePlacesRoutes from "./src/modules/mobile/places/mobile.places.routes.js";
import mobileShopsRoutes from "./src/modules/mobile/shops/mobile.shops.routes.js";
import mobileOrdersRoutes from "./src/modules/mobile/orders/mobile.orders.routes.js";
import mobilePrescriptionsRoutes from "./src/modules/mobile/prescriptions/mobile.prescriptions.routes.js";
import mobileNotificationsRoutes from "./src/modules/mobile/notifications/mobile.notifications.routes.js";
import mobilePushRoutes from "./src/modules/mobile/push/mobile.push.routes.js";
import mobileCheckoutRoutes from "./src/modules/mobile/checkout/mobile.checkout.routes.js";
import mobileAppConfigRoutes from "./src/modules/mobile/app-config/mobile.appConfig.routes.js";
import mobileLoyaltyRoutes from "./src/modules/mobile/loyalty/mobile.loyalty.routes.js";
import mobileCouponRoutes from "./src/modules/mobile/coupons/mobile.coupon.routes.js";
import mobileSupportRoutes from "./src/modules/mobile/support/mobile.support.routes.js";

// ============================================
// RIDER ROUTES
// ============================================
import riderAuthRoutes from "./src/modules/rider/auth/rider.auth.routes.js";
import riderOnboardingRoutes from "./src/modules/rider/onboarding/rider.onboarding.routes.js";
import riderSseRoutes from "./src/modules/rider/sse/rider.sse.routes.js";

// ============================================
// APP SETUP
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.USER_FRONTEND_ORIGIN || "http://localhost:5173",
  process.env.ADMIN_FRONTEND_ORIGIN || "http://localhost:5174",
  process.env.LANDING_FRONTEND_ORIGIN || "http://localhost:5175",
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  exposedHeaders: ["X-Maintenance-Mode"],
};

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

app.options("/{*path}", cors(corsOptions));
app.use(cors(corsOptions));

app.use(
  "/mobile/checkout/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString("utf8");
      try {
        req.body = JSON.parse(req.rawBody);
      } catch {
        req.body = {};
      }
    }
    next();
  },
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ============================================
// MAINTENANCE + RATE LIMITING
// ============================================
app.use(maintenanceMiddleware);
app.use("/api/maintenance", maintenanceRoutes);

app.use("/api/notifications/stream", (req, res, next) => next());
app.use("/cadmin/notifications/stream", (req, res, next) => next());
app.use("/rider/sse/stream", (req, res, next) => next());

app.use("/api/notifications/unread-count", relaxedLimiter);
app.use("/api/notifications/recent", relaxedLimiter);
app.use("/api/purchase/returns", relaxedLimiter);

app.use("/api", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return globalLimiter(req, res, next);
});

app.use("/cadmin", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return cadminLimiter(req, res, next);
});

app.use("/mobile", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return mobileLimiter(req, res, next);
});

app.use("/rider", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return mobileLimiter(req, res, next);
});

// ============================================
// FILE SERVING
// ============================================
app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.removeHeader("X-Frame-Options");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

app.use(
  "/static/medicine_images",
  express.static(path.join(__dirname, "static/medicine_images")),
);

// ============================================
// ERP ROUTES
// ============================================
app.use("/api/files", filesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/pending", pendingRoutes);
app.use("/api/shop/files", shopFilesRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/enquiries", enquiriesRoutes);
app.use("/api/notifications", userNotificationRoutes);
app.use("/api/public", publicUnsubscribeRoutes);
app.use("/api/medicine-linking", linkingRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/excel", excelRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/marketplace-listing", listingsRoutes);
app.use("/api/marketplace-orders", marketplaceOrdersRoutes);
app.use("/api/marketplace/dashboard", marketplaceDashboardRoutes);
app.use("/api/inventory/import", inventoryImportRoutes);
app.use("/api/prescription-requests", prescriptionRequestsErpRouter);
app.use("/api/reports/sales", salesReportRoutes);
app.use("/api/reports/purchase", purchaseReportRoutes);
app.use("/api/reports/inventory", inventoryReportRoutes);
app.use("/api/reports/gst", gstReportRoutes);
app.use("/api/reports/financial", financialReportRoutes);
app.use("/api/reports/marketplace", marketplaceReportRoutes);

// ============================================
// CADMIN ROUTES
// ============================================
app.use("/cadmin", cadminAuthRoutes);
app.use("/cadmin", cadminNotificationRoutes);
app.use("/cadmin", cadminRolesRoutes);
app.use("/cadmin", cadminDocsRoutes);
app.use("/cadmin", cadminUserRoutes);
app.use("/cadmin", cadminShopsRoutes);
app.use("/cadmin", cadminPlansRoutes);
app.use("/cadmin", cadminAdminRoutes);
app.use("/cadmin", cadminProfileRoutes);
app.use("/cadmin", cadminTicketsRoutes);
app.use("/cadmin", cadminEnquiriesRoutes);
app.use("/cadmin", cadminSubscriptionsRoutes);
app.use("/cadmin", cadminAuditRoutes);
app.use("/cadmin", cadminBroadcastInAppRoutes);

app.use("/cadmin", cadminEmailBroadcastRoutes);
app.use("/cadmin", cadminDashboardRoutes);
app.use("/cadmin", cadminMasterMedicinesRoutes);
app.use("/cadmin", cadminMarketplaceRoutes);
app.use("/cadmin", cadminMobileUsersRoutes);
app.use("/cadmin", cadminMarketplaceOrdersRoutes);
app.use("/cadmin", cadminMobileBroadcastRoutes);
app.use("/cadmin", cadminPricingRoutes);
app.use("/cadmin", cadminAppConfigRoutes);
app.use("/cadmin", cadminRiderRoutes);
app.use("/cadmin/coupons", cadminCouponRoutes);
app.use("/cadmin", cadminCustomerSupportRoutes);
app.use("/cadmin", cadminMobileEmailBroadcastRoutes);

// ============================================
// MOBILE ROUTES
// ============================================
app.use("/mobile/auth", mobileAuthRoutes);
app.use("/mobile/users", mobileUsersRoutes);
app.use("/mobile/medicines", mobileMedicinesRoutes);
app.use("/mobile/places", mobilePlacesRoutes);
app.use("/mobile/shops", mobileShopsRoutes);
app.use("/mobile/orders", mobileOrdersRoutes);
app.use("/mobile/prescriptions", mobilePrescriptionsRoutes);
app.use("/mobile/notifications", mobileNotificationsRoutes);
app.use("/mobile/push", mobilePushRoutes);
app.use("/mobile/checkout", mobileCheckoutRoutes);
app.use("/mobile/prescription-requests", prescriptionRequestsMobileRouter);
app.use("/mobile/app-config", mobileAppConfigRoutes);
app.use("/mobile/loyalty", mobileLoyaltyRoutes);
app.use("/mobile/coupons", mobileCouponRoutes);
app.use("/mobile/support", mobileSupportRoutes);

// ============================================
// RIDER ROUTES
// ============================================
app.use("/rider/auth", riderAuthRoutes);
app.use("/rider/onboarding", riderOnboardingRoutes);
app.use("/rider/sse", riderSseRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    maintenance_mode: process.env.MAINTENANCE_MODE?.toLowerCase() === "true",
  });
});

// ============================================
// 404 + ERROR HANDLERS
// ============================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

function printStartupBanner(port) {
  const env = process.env.NODE_ENV || "development";
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const lines = [
    "",
    "-----------------------------------------------",
    "  SERVER STARTED",
    "-----------------------------------------------",
    `  Port        : ${port}`,
    `  Environment : ${env}`,
    `  Time (IST)  : ${time}`,
    `  Origins     : ${allowedOrigins.join(", ")}`,
    "-----------------------------------------------",
    "",
  ];

  lines.forEach((line) => process.stdout.write(line + "\n"));
}

(async () => {
  console.log("\n🔍 Checking performance indexes...");
  await ensureIndexes();

  // Print review mode status at server startup
  try {
    const { isReviewMode } = await import("./src/config/reviewCredentials.js");
    console.log(`🛡️  Review Mode Status: [ ${isReviewMode() ? "ACTIVE (Bypasses Enabled)" : "DISABLED"} ]`);
  } catch (err) {
    console.warn("⚠️  Could not read Review Mode status:", err.message);
  }

  app.listen(PORT, () => {
    printStartupBanner(PORT);
    initializeCronJobs();
  });
})();