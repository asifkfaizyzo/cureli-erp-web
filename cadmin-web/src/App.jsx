// cadmin-web/src/App.jsx (do not remove this comment)

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

import AdminLoginPage from "./pages/Cadmin-Login/AdminLoginPage";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import UserPage from "./pages/Users-management/UserPage";
import CAdminForgotPassword from "./pages/Cadmin-Login/CAdminForgotPassword";
import CAdminResetPassword from "./pages/Cadmin-Login/CAdminResetPassword";
import VerificationPage from "./pages/User-Shop-Verifications/VerificationPage";
import ShopsPage from "./pages/shops-management/ShopsPage";
import AdminsPage from "./pages/Cadmin-management/AdminsPage";
import OrdersPage from "./pages/orders/OrdersPage";
import MasterMedicinesPage from "./pages/MasterMedicines/MasterMedicinesPage";
import RiskMonitorPage from "./pages/Subscription-management/RiskMonitorPage";
import SubscriptionPage from "./pages/Subscription-management/SubscriptionPage";
import CommunicationsPage from "./pages/Communications/CommunicationsPage";
import TicketsPage from "./pages/Communications/pages/Tickets/TicketsPage";
import EnquiriesPage from "./pages/Communications/pages/Enquiries/EnquiriesPage";
import BroadcastPage from "./pages/Communications/pages/Broadcast/BroadcastPage";
import InAppBroadcastPage from "./pages/Communications/pages/Broadcast/InApp/InAppBroadcastPage";
import EmailBroadcastPage from "./pages/Communications/pages/Broadcast/Email/EmailBroadcastPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import AuditPage from "./pages/Audit/AuditPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import CategoryDisplayPage from "./pages/AppConfig/categories/CategoryDisplayPage";
import LoyaltyConfigPage from "./pages/AppConfig/loyalty/LoyaltyConfigPage";
import CouponsPage from "./pages/AppConfig/Coupons/CouponsPage";

// ── Marketplace ──────────────────────────────────────────────────────────────
import MarketplaceDashboard from "./pages/marketplace/Dashboard/MarketplaceDashboard";
import MarketplaceUsersPage from "./pages/marketplace/Users/MarketplaceUsersPage";
import MarketplaceOrdersPage from "./pages/marketplace/Orders/MarketplaceOrdersPage";
import MarketplaceShopsPage from "./pages/marketplace/Shops/MarketplaceShopsPage";
import MarketplacePricingPage from "./pages/marketplace/Pricing/MarketplacePricingPage";
import AppConfigPage from "./pages/AppConfig/AppConfigPage";
import BannersPage from "./pages/AppConfig/banners/BannersPage";
import HomeScreenPage from "./pages/AppConfig/home-screen/HomeScreenPage";

// ── Marketplace Communications ──────────────────────────────────────────────
import MarketplaceCommunicationsPage from "./pages/marketplace/Communications/MarketplaceCommunicationsPage";
import CustomerTicketsPage from "./pages/Communications/pages/CustomerTickets/CustomerTicketsPage";
import MobileBroadcastPage from "./pages/Communications/pages/Broadcast/Mobile/MobileBroadcastPage";
import MobileEmailBroadcastPage from "./pages/marketplace/Communications/pages/Email/MobileEmailBroadcastPage";

// ── Fleet ────────────────────────────────────────────────────────────────────
import FleetDashboard from "./pages/Fleet/Dashboard/FleetDashboard";
import RidersPage from "./pages/Fleet/Riders/RidersPage";
import RiderVerificationPage from "./pages/Fleet/Verification/RiderVerificationPage";
import FleetCommunicationsPage from "./pages/Fleet/Communications/FleetCommunicationsPage";
import FleetPricingPage from "./pages/Fleet/Pricing/FleetPricingPage";
import BasePayPage from "./pages/Fleet/Pricing/BasePayPage";
import IncentivesPage from "./pages/Fleet/Pricing/IncentivesPage";

import AppLayout from "./components/layout/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import { PermissionGuard } from "./components/common/PermissionGuard";
import { CADMIN_PERMISSIONS } from "./config/cadminPermissions";

const ProtectedLayout = () => (
  <AuthProvider>
    <AppLayout />
  </AuthProvider>
);

function App() {
  useEffect(() => {
    const disableZoomScroll = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const disableKeyZoom = (e) => {
      if (e.ctrlKey && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
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
        {/* ── Public ──────────────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route
          path="/admin-forgot-password"
          element={<CAdminForgotPassword />}
        />
        <Route path="/reset-password" element={<CAdminResetPassword />} />

        {/* ── Protected (AuthProvider & Sidebar Context Active) ───────── */}
        <Route element={<ProtectedLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<AdminDashboard />} />

          {/* Shops */}
          <Route
            path="/shops"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.SHOPS_VIEW}>
                <ShopsPage />
              </PermissionGuard>
            }
          />

          {/* Users */}
          <Route
            path="/users"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.USERS_VIEW}>
                <UserPage />
              </PermissionGuard>
            }
          />

          {/* Document Verification */}
          <Route
            path="/verification"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.DOCUMENTS_VIEW}>
                <VerificationPage />
              </PermissionGuard>
            }
          />

          {/* Subscriptions — Risk Monitor */}
          <Route
            path="/subscriptions"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK}
              >
                <RiskMonitorPage />
              </PermissionGuard>
            }
          />

          {/* Subscriptions — Manage */}
          <Route
            path="/subscriptions/manage"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_DETAIL}
              >
                <SubscriptionPage />
              </PermissionGuard>
            }
          />

          {/* Orders */}
          <Route path="/orders" element={<OrdersPage />} />

          {/* Audit */}
          <Route
            path="/audits"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.AUDIT_VIEW}>
                <AuditPage />
              </PermissionGuard>
            }
          />

          {/* Admin Management */}
          <Route
            path="/admins"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.ADMINS_VIEW}>
                <AdminsPage />
              </PermissionGuard>
            }
          />

          {/* Master Medicines — shared between admin and marketplace */}
          <Route
            path="/master-medicines"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW}
              >
                <MasterMedicinesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/master-medicines"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW}
              >
                <MasterMedicinesPage />
              </PermissionGuard>
            }
          />

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* ── Admin Communications ─────────────────────────────────────── */}
          <Route
            path="/communications"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.TICKETS_VIEW,
                  CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
                ]}
                requireAll={false}
              >
                <CommunicationsPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/communications/tickets"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.TICKETS_VIEW}>
                <TicketsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/communications/enquiries"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.ENQUIRIES_VIEW}>
                <EnquiriesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/communications/broadcast"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
                ]}
                requireAll={false}
              >
                <BroadcastPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/communications/broadcast/in-app"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
                ]}
                requireAll={false}
              >
                <InAppBroadcastPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/communications/broadcast/email"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
                ]}
                requireAll={false}
              >
                <EmailBroadcastPage />
              </PermissionGuard>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.SETTINGS_VIEW}>
                <SettingsPage />
              </PermissionGuard>
            }
          />

          {/* ── Marketplace ─────────────────────────────────────────────── */}
          <Route
            path="/marketplace/dashboard"
            element={<MarketplaceDashboard />}
          />
          <Route path="/marketplace/users" element={<MarketplaceUsersPage />} />
          <Route
            path="/marketplace/orders"
            element={<MarketplaceOrdersPage />}
          />
          <Route
            path="/marketplace/pricing"
            element={<MarketplacePricingPage />}
          />
          <Route path="/marketplace/shops" element={<MarketplaceShopsPage />} />

          {/* ── Marketplace Communications ──────────────────────────────── */}
          <Route
            path="/marketplace/communications"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW,
                  CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_MOBILE_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_MOBILE_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_MOBILE_SCHEDULE,
                ]}
                requireAll={false}
              >
                <MarketplaceCommunicationsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/communications/customer-tickets"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW}
              >
                <CustomerTicketsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/communications/email"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
                ]}
                requireAll={false}
              >
                <MobileEmailBroadcastPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/communications/push"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_MOBILE_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_MOBILE_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_MOBILE_SCHEDULE,
                ]}
                requireAll={false}
              >
                <MobileBroadcastPage />
              </PermissionGuard>
            }
          />

          {/* ── App Config ──────────────────────────────────────────────── */}
          <Route
            path="/marketplace/app-config"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.APP_CONFIG_VIEW}>
                <AppConfigPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/app-config/categories"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.APP_CONFIG_VIEW}>
                <CategoryDisplayPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/app-config/banners"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.APP_CONFIG_VIEW}>
                <BannersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/app-config/home-screen"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.APP_CONFIG_VIEW}>
                <HomeScreenPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/app-config/loyalty"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_LOYALTY}
              >
                <LoyaltyConfigPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/marketplace/app-config/coupons"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.COUPONS_VIEW}>
                <CouponsPage />
              </PermissionGuard>
            }
          />

          {/* ── Fleet ──────────────────────────────────────────────────── */}
          <Route path="/fleet/dashboard" element={<FleetDashboard />} />
          <Route
            path="/fleet/riders"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.FLEET_RIDERS_VIEW}
              >
                <RidersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/fleet/verification"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.FLEET_VERIFICATION_VIEW}
              >
                <RiderVerificationPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/fleet/communications"
            element={<FleetCommunicationsPage />}
          />

          {/* ── Fleet Pricing & Incentives ───────────────────────────────── */}
          <Route
            path="/fleet/pricing"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.FLEET_PRICING_VIEW}
              >
                <FleetPricingPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/fleet/pricing/base-pay"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.FLEET_PRICING_VIEW}
              >
                <BasePayPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/fleet/pricing/incentives"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.FLEET_INCENTIVES_VIEW}
              >
                <IncentivesPage />
              </PermissionGuard>
            }
          />
        </Route>

        {/* ── Catch-all ───────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
