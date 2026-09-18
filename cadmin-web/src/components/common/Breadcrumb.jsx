// cadmin-web/src/components/common/Breadcrumb.jsx

import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

const ADMIN_PATHS = {
  Dashboard: "/dashboard",
  Users: "/users",
  Shops: "/shops",
  Orders: "/orders",
  Verification: "/verification",
  Subscriptions: "/subscriptions",
  Plans: "/subscriptions/manage",
  Audits: "/audits",
  Admins: "/admins",
  Settings: "/settings",
  Notifications: "/notifications",

  // Admin Comms
  Communications: "/communications",
  Tickets: "/communications/tickets",
  "Shop Tickets": "/communications/tickets",
  Enquiries: "/communications/enquiries",
  Broadcast: "/communications/broadcast",
  "In-App": "/communications/broadcast/in-app",
  "In-App Broadcast": "/communications/broadcast/in-app",
  "Email Broadcast": "/communications/broadcast/email",
  "Master Medicines": "/master-medicines",
};

const MARKETPLACE_PATHS = {
  Marketplace: "/marketplace/dashboard",
  "MP Dashboard": "/marketplace/dashboard",
  Users: "/marketplace/users",
  Shops: "/marketplace/shops",
  Orders: "/marketplace/orders",
  Pricing: "/marketplace/pricing",
  "Master Medicines": "/marketplace/master-medicines",

  // App Config
  "App Config": "/marketplace/app-config",
  Categories: "/marketplace/app-config/categories",
  Banners: "/marketplace/app-config/banners",
  "Home Layout": "/marketplace/app-config/home-screen",
  "Loyalty Config": "/marketplace/app-config/loyalty",
  Coupons: "/marketplace/app-config/coupons",

  // Marketplace Comms
  Communications: "/marketplace/communications",
  "Customer Tickets": "/marketplace/communications/customer-tickets",
  "Push Notifications": "/marketplace/communications/push",
  "Email Broadcast": "/marketplace/communications/email",
};

const FLEET_PATHS = {
  Fleet: "/fleet/dashboard",
  Dashboard: "/fleet/dashboard",
  Riders: "/fleet/riders",
  Verification: "/fleet/verification",
  "Rider Verification": "/fleet/verification",
  Communications: "/fleet/communications",
  "Fleet Communications": "/fleet/communications",
  Pricing: "/fleet/pricing",
  "Fleet Pricing": "/fleet/pricing",
};

const Breadcrumb = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = useMenuStore((s) => s.breadcrumbs);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const isMarketplace = location.pathname.startsWith("/marketplace");
  const isFleet       = location.pathname.startsWith("/fleet");

  const activePathMap = isFleet
    ? FLEET_PATHS
    : isMarketplace
      ? MARKETPLACE_PATHS
      : ADMIN_PATHS;

  const getBreadcrumbPath = (crumb) => {
    return activePathMap[crumb] || ADMIN_PATHS[crumb] || null;
  };

  const crumbs = useMemo(
    () => (breadcrumbs?.length > 0 ? breadcrumbs : ["Dashboard"]),
    [breadcrumbs],
  );

  const handleCrumbClick = (crumb, index) => {
    const path = getBreadcrumbPath(crumb);
    if (!path) return;
    setBreadcrumbs(crumbs.slice(0, index + 1));
    navigate(path);
  };

  return (
    <nav
      className="text-sm flex items-center gap-1.5 mb-3"
      aria-label="Breadcrumb"
    >
      <Home size={14} className="text-gray-400 flex-shrink-0" />
      <span className="text-gray-300 select-none">›</span>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const path = getBreadcrumbPath(crumb);
        const isClickable = !isLast && !!path;

        return (
          <span key={index} className="flex items-center gap-1.5">
            {isClickable ? (
              <button
                onClick={() => handleCrumbClick(crumb, index)}
                className="text-gray-400 hover:text-gray-800 transition-colors duration-150"
              >
                {crumb}
              </button>
            ) : (
              <span
                className={
                  isLast ? "text-gray-700 font-medium" : "text-gray-400"
                }
              >
                {crumb}
              </span>
            )}
            {!isLast && <span className="text-gray-300 select-none">›</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;