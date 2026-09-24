// pharmacy-web/src/App.jsx (do not remove this comment)
// src/App.jsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

// ============================================
// AUTH INITIALIZATION
// ============================================
import { useAuthStore } from "./store/useAuthStore";

// ============================================
// GUARDS
// ============================================
import AuthGuard from "./guards/AuthGuard";
import SetupGuard from "./guards/SetupGuard";
import PermissionGuard from "./guards/PermissionGuard";
import OnboardingGuard from "./guards/OnboardingGuard";
import BranchRequiredGuard from "./guards/BranchRequiredGuard";
import MarketplaceOnboardingGuard from "./guards/MarketplaceOnboardingGuard.jsx";

// ============================================
// PERMISSIONS CONFIG
// ============================================
import { PERMISSIONS } from "./config/permissions";

// ============================================
// PUBLIC PAGES
// ============================================
import NotFoundPage from "./components/common/NotFoundPage.jsx";
import DeveloperStamp from "./components/common/DeveloperStamp.jsx";
import LoginPage from "./pages/login/LoginPage.jsx";
import OnboardingPage from "./pages/onboarding/OnboardingPage.jsx";
import ErrorPage from "./pages/error/ErrorPage.jsx";
import TermsPage from "./pages/common/TermsPage.jsx";
import PrivacyPage from "./pages/common/PrivacyPage.jsx";
import ForgotPasswordPage from "./pages/login/comps/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/login/comps/ResetPasswordPage.jsx";
import PlanSelectionPage from "./pages/plan-selection/PlanSelectionPage.jsx";
import VerificationPage from "./pages/verification/VerificationPage.jsx";
import MaintenancePage from "./pages/maintenance/MaintenancePage.jsx";

// ============================================
// LAYOUT
// ============================================
import AppLayout from "./components/layout/AppLayout.jsx";
import OnboardingShellLayout from "./components/layout/OnboardingShellLayout.jsx";

// ============================================
// ERP PAGES
// ============================================
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import BillingPage from "./pages/sales/billing/SalesBillingPage.jsx";
import InvoicePage from "./pages/sales/invoice/SalesInvoicePage.jsx";
import PurchaseInvoicePage from "./pages/purchase/invoice/PurchaseInvoicePage.jsx";
import PurchaseReturnsPage from "./pages/purchase/returns/PurchaseReturnsPage.jsx";
import SalesReturnsPage from "./pages/sales/returns/SalesReturnsPage.jsx";
import PurchasePage from "./pages/purchase/billing/PurchasePage.jsx";
import InventoryPage from "./pages/inventory/InventoryPage.jsx";
import SupplierPage from "./pages/suppliers/SupplierPage.jsx";

// ============================================
// ERP — REPORTS (SALES — SECTION A)
// ============================================
import SalesSummaryPage from "./pages/report/sales/SalesSummaryPage.jsx";
import SalesRegisterPage from "./pages/report/sales/SalesRegisterPage.jsx";
import SalesProfitPage from "./pages/report/sales/SalesProfitPage.jsx";
import SalesReturnsReportPage from "./pages/report/sales/SalesReturnsReportPage.jsx";
import PaymentCollectionPage from "./pages/report/sales/PaymentCollectionPage.jsx";
import OutstandingReceivablesPage from "./pages/report/sales/OutstandingReceivablesPage.jsx";
import DayBookPage from "./pages/report/sales/DayBookPage.jsx";

// ============================================
// ERP — REPORTS (PURCHASE — SECTION B)
// ============================================
import PurchaseRegisterPage from "./pages/report/purchase/PurchaseRegisterPage.jsx";
import PurchaseOutstandingPage from "./pages/report/purchase/PurchaseOutstandingPage.jsx";
import PurchaseReturnsReportPage from "./pages/report/purchase/PurchaseReturnsPage.jsx";

// ============================================
// ERP — REPORTS (INVENTORY — SECTION C)
// ============================================
import CurrentStockReportPage from "./pages/report/inventory/CurrentStockReportPage.jsx";
import ExpiryReportPage from "./pages/report/inventory/ExpiryReportPage.jsx";
import MinStockReorderReportPage from "./pages/report/inventory/MinStockReorderReportPage.jsx";
import DeadStockReportPage from "./pages/report/inventory/DeadStockReportPage.jsx";
import StockAdjustmentReportPage from "./pages/report/inventory/StockAdjustmentReportPage.jsx";

// ============================================
// ERP — REPORTS (GST — SECTION D)
// ============================================
import GSTR1ReportPage from "./pages/report/gst/GSTR1ReportPage.jsx";
import GSTR2ReportPage from "./pages/report/gst/GSTR2ReportPage.jsx";
import GSTR3BReportPage from "./pages/report/gst/GSTR3BReportPage.jsx";

// ============================================
// ERP — REPORTS (FINANCIAL — SECTION E)
// ============================================
import MedicinePLReportPage from "./pages/report/financial/MedicinePLReportPage.jsx";
import PeriodPLReportPage from "./pages/report/financial/PeriodPLReportPage.jsx";

// ============================================
// ERP — REPORTS (MARKETPLACE — SECTION F)
// ============================================
import MarketplaceSalesSummaryPage from "./pages/report/marketplace/MarketplaceSalesSummaryPage.jsx";
import OrderStatusFunnelPage from "./pages/report/marketplace/OrderStatusFunnelPage.jsx";
import AcceptanceRatePage from "./pages/report/marketplace/AcceptanceRatePage.jsx";
import PrescriptionRequestSummaryPage from "./pages/report/marketplace/PrescriptionRequestSummaryPage.jsx";
import ListingHealthPage from "./pages/report/marketplace/ListingHealthPage.jsx";

// ============================================
// ERP — SETTINGS PAGES
// ============================================
import UsersPage from "./pages/settings/users/UsersPage.jsx";
import BranchesPage from "./pages/settings/branches/BranchesPage.jsx";
import ProfilePage from "./pages/settings/profile/ProfilePage.jsx";
import UpgradePlanPage from "./pages/settings/plans/UpgradePlanPage.jsx";

// ============================================
// ERP — SUPPORT & NOTIFICATIONS
// ============================================
import TicketsPage from "./pages/tickets/TicketsPage.jsx";
import NotificationsPage from "./pages/notifications/NotificationsPage.jsx";

// ============================================
// SETUP PAGES (3-step wizard)
// ============================================
import SetupLayout from "./pages/setup/comps/SetupLayout.jsx";
import SetupRouter from "./pages/setup/SetupRouter.jsx";
import SetupBranchesPage from "./pages/setup/SetupBranchesPage.jsx";
import SetupUsersPage from "./pages/setup/SetupUsersPage.jsx";
import SetupReviewPage from "./pages/setup/SetupReviewPage.jsx";

// ============================================
// MARKETPLACE PAGES
// ============================================
import MarketplaceOnboardingPage from "./pages/marketplace-onboarding/MarketplaceOnboardingPage.jsx";
import MarketplaceDashboardPage from "./pages/marketplace-dashboard/MarketplaceDashboardPage.jsx";
import MarketplaceOrdersPage from "./pages/marketplace-orders/MarketplaceOrdersPage.jsx";
import MarketplaceListingsPage from "./pages/marketplace-listings/MarketplaceListingsPage.jsx";
import MarketplaceStorefrontPage from "./pages/marketplace-storefront/MarketplaceStorefrontPage.jsx";

import "./index.css";

// ============================================
// MAINTENANCE CHECK COMPONENT
// ============================================
const MaintenanceCheck = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      if (window.location.pathname === "/maintenance") {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/maintenance/status`,
        );
        const data = await response.json();

        if (data.success && data.data.maintenance_mode) {
          setIsMaintenanceMode(true);
          sessionStorage.setItem("maintenance_mode", "true");
          sessionStorage.setItem(
            "maintenance_message",
            data.data.message || "",
          );
          window.location.href = "/maintenance";
          return;
        } else {
          setIsMaintenanceMode(false);
          sessionStorage.removeItem("maintenance_mode");
          sessionStorage.removeItem("maintenance_message");
        }
      } catch (error) {
        console.error("Failed to check maintenance status:", error);
        const cached = sessionStorage.getItem("maintenance_mode");
        if (cached === "true") {
          setIsMaintenanceMode(true);
          window.location.href = "/maintenance";
          return;
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkMaintenance();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#000060]" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isMaintenanceMode) return null;

  return children;
};

// ============================================
// AUTH INITIALIZER COMPONENT
// ============================================
const AuthInitializer = ({ children }) => {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return children;
};

// ============================================
// MAIN APP COMPONENT
// ============================================
const App = () => {
  useEffect(() => {
    const disableZoomScroll = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const disableKeyZoom = (e) => {
      if (
        e.ctrlKey &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    };
    const disablePinch = (e) => e.preventDefault();

    window.addEventListener("wheel", disableZoomScroll, { passive: false });
    window.addEventListener("keydown", disableKeyZoom);
    window.addEventListener("gesturestart", disablePinch);
    window.addEventListener("gesturechange", disablePinch);
    window.addEventListener("gestureend", disablePinch);

    return () => {
      window.removeEventListener("wheel", disableZoomScroll);
      window.removeEventListener("keydown", disableKeyZoom);
      window.removeEventListener("gesturestart", disablePinch);
      window.removeEventListener("gesturechange", disablePinch);
      window.removeEventListener("gestureend", disablePinch);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* ── MAINTENANCE (always accessible) ── */}
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* ── ALL OTHER ROUTES ── */}
        <Route
          path="/*"
          element={
            <MaintenanceCheck>
              <AuthInitializer>
                <Routes>
                  {/* ── ROOT REDIRECT ── */}
                  <Route path="/" element={<Navigate to="/login" replace />} />

                  {/* ── PUBLIC ROUTES ── */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />

                  {/* ── ONBOARDING ROUTES ── */}
                  <Route element={<OnboardingGuard />}>
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route
                      path="/verification"
                      element={<VerificationPage />}
                    />
                  </Route>

                  {/* ── POST-VERIFICATION (token required, pre-setup) ── */}
                  <Route element={<AuthGuard />}>
                    <Route
                      path="/plan-selection"
                      element={<PlanSelectionPage />}
                    />
                    <Route path="/setup" element={<SetupRouter />} />
                    <Route element={<SetupLayout />}>
                      <Route
                        path="/setup/branches"
                        element={<SetupBranchesPage />}
                      />
                      <Route path="/setup/users" element={<SetupUsersPage />} />
                      <Route
                        path="/setup/review"
                        element={<SetupReviewPage />}
                      />
                    </Route>
                  </Route>

                  {/* ── DEV TOOL ── */}
                  <Route path="/yzo-dev" element={<DeveloperStamp />} />

                  {/* ════════════════════════════════════════════════
                      MARKETPLACE ONBOARDING  →  /marketplace/onboarding
                  ════════════════════════════════════════════════ */}
                  <Route element={<AuthGuard />}>
                    <Route element={<SetupGuard />}>
                      <Route element={<OnboardingShellLayout />}>
                        <Route
                          path="/marketplace/onboarding"
                          element={<MarketplaceOnboardingPage />}
                        />
                      </Route>
                    </Route>
                  </Route>

                  {/* ════════════════════════════════════════════════
                      ERP ROUTES  →  /erp/*
                      + MARKETPLACE POST-ONBOARDING  →  /marketplace/*
                  ════════════════════════════════════════════════ */}
                  <Route element={<AuthGuard />}>
                    <Route element={<SetupGuard />}>
                      <Route element={<AppLayout />}>
                        {/* Dashboard */}
                        <Route
                          path="/erp/dashboard"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.DASHBOARD_VIEW}
                            >
                              <DashboardPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SALES ── */}
                        <Route
                          path="/erp/sales-billing"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.BILLING_CREATE}
                            >
                              <BranchRequiredGuard>
                                <BillingPage />
                              </BranchRequiredGuard>
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/sales-invoice"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.BILLING_VIEW}
                            >
                              <InvoicePage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/sales-returns"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.BILLING_VIEW}
                            >
                              <SalesReturnsPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── PURCHASE ── */}
                        <Route
                          path="/erp/purchase-billing"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.PURCHASE_CREATE}
                            >
                              <BranchRequiredGuard>
                                <PurchasePage />
                              </BranchRequiredGuard>
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/purchase-invoices"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.PURCHASE_VIEW}
                            >
                              <PurchaseInvoicePage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/purchase-returns"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.PURCHASE_VIEW}
                            >
                              <PurchaseReturnsPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── INVENTORY ── */}
                        <Route
                          path="/erp/inventory"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.INVENTORY_VIEW}
                            >
                              <InventoryPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SECTION A: REPORTS — SALES ── */}
                        <Route
                          path="/erp/reports/sales/summary"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <SalesSummaryPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/sales/register"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <SalesRegisterPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/sales/profit"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <SalesProfitPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/sales/returns"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <SalesReturnsReportPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/sales/payments"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <PaymentCollectionPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/sales/outstanding"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <OutstandingReceivablesPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/sales/daybook"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <DayBookPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SECTION B: REPORTS — PURCHASE ── */}
                        <Route
                          path="/erp/reports/purchase/register"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_PURCHASE}
                            >
                              <PurchaseRegisterPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/purchase/outstanding"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_PURCHASE}
                            >
                              <PurchaseOutstandingPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/purchase/returns"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_PURCHASE}
                            >
                              <PurchaseReturnsReportPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SECTION C: REPORTS — INVENTORY ── */}
                        <Route
                          path="/erp/reports/inventory/current-stock"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.INVENTORY_VIEW}
                            >
                              <CurrentStockReportPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/inventory/expiry"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.INVENTORY_VIEW}
                            >
                              <ExpiryReportPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/inventory/min-stock"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.INVENTORY_VIEW}
                            >
                              <MinStockReorderReportPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/inventory/dead-stock"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.INVENTORY_VIEW}
                            >
                              <DeadStockReportPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/inventory/adjustments"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.INVENTORY_VIEW}
                            >
                              <StockAdjustmentReportPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SECTION D: REPORTS — GST ── */}
                        <Route
                          path="/erp/reports/gst/gstr1"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <GSTR1ReportPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/gst/gstr2"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_PURCHASE}
                            >
                              <GSTR2ReportPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/gst/gstr3b"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <GSTR3BReportPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SECTION E: REPORTS — FINANCIAL ── */}
                        <Route
                          path="/erp/reports/financial/medicine-pl"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_FINANCIAL}
                            >
                              <MedicinePLReportPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/financial/period-pl"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_FINANCIAL}
                            >
                              <PeriodPLReportPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SECTION F: REPORTS — MARKETPLACE ── */}
                        <Route
                          path="/erp/reports/marketplace/sales-summary"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <MarketplaceSalesSummaryPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/marketplace/order-funnel"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <OrderStatusFunnelPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/marketplace/acceptance-rate"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <AcceptanceRatePage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/marketplace/prescription-summary"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <PrescriptionRequestSummaryPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/reports/marketplace/listing-health"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.REPORTS_SALES}
                            >
                              <ListingHealthPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SUPPLIERS ── */}
                        <Route
                          path="/erp/suppliers"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.SUPPLIERS_VIEW}
                            >
                              <SupplierPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ── SETTINGS ── */}
                        <Route
                          path="/erp/settings/users"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.USERS_VIEW}
                            >
                              <UsersPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/settings/branches"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.BRANCHES_VIEW}
                            >
                              <BranchesPage />
                            </PermissionGuard>
                          }
                        />
                        <Route
                          path="/erp/settings/profile"
                          element={<ProfilePage />}
                        />
                        <Route
                          path="/erp/settings/upgrade"
                          element={<UpgradePlanPage />}
                        />

                        {/* ── NOTIFICATIONS ── */}
                        <Route
                          path="/erp/notifications"
                          element={<NotificationsPage />}
                        />

                        {/* ── SUPPORT ── */}
                        <Route
                          path="/erp/tickets"
                          element={
                            <PermissionGuard
                              permission={PERMISSIONS.TICKETS_VIEW}
                            >
                              <TicketsPage />
                            </PermissionGuard>
                          }
                        />

                        {/* ════════════════════════════════════════════════
                            MARKETPLACE POST-ONBOARDING  →  /marketplace/*
                        ════════════════════════════════════════════════ */}
                        <Route element={<MarketplaceOnboardingGuard />}>
                          <Route
                            path="/marketplace/dashboard"
                            element={<MarketplaceDashboardPage />}
                          />
                          <Route
                            path="/marketplace/orders"
                            element={<MarketplaceOrdersPage />}
                          />
                          <Route
                            path="/marketplace/listings"
                            element={<MarketplaceListingsPage />}
                          />
                          <Route
                            path="/marketplace/storefront"
                            element={<MarketplaceStorefrontPage />}
                          />
                        </Route>
                      </Route>
                    </Route>
                  </Route>

                  {/* ── ERROR PAGES ── */}
                  <Route path="/error" element={<ErrorPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AuthInitializer>
            </MaintenanceCheck>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;