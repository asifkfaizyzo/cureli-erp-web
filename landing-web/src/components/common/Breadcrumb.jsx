// landing-web/src/components/common/Breadcrumb.jsx (do not remove this comment)

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMenuStore } from "../../store/useMenuStore";

/**
 * Complete breadcrumb path mapping
 * Derived from App.jsx routes and Sidebar.jsx menu structure
 */
const BREADCRUMB_PATHS = {
  // ═══════════════════════════════════════════
  // MAIN SECTIONS
  // ═══════════════════════════════════════════
  "Dashboard": "/dashboard",
  "Inventory": "/inventory",
  "Suppliers": "/suppliers",

  // ═══════════════════════════════════════════
  // SALES
  // ═══════════════════════════════════════════
  "Sales": "/Salesbilling",

  // ═══════════════════════════════════════════
  // PURCHASE
  // ═══════════════════════════════════════════
  "Purchase": "/purchase-billing",

  // ═══════════════════════════════════════════
  // REPORTS
  // ═══════════════════════════════════════════
  "Reports": "/reports-sales",
  "Sales Report": "/reports-sales",
  "Purchase Report": "/reports-purchase",
  "Inventory Report": "/reports-inventory",
  "Finance Report": "/reports-finance",

  // ═══════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════
  "Settings": "/settings/profile",
  "Users": "/settings/users",
  "Branches": "/settings/branches",
  "Profile": "/settings/profile",
  "Plans": "/settings/upgrade",

  // ═══════════════════════════════════════════
  // SUPPORT
  // ═══════════════════════════════════════════
  "Support": "/tickets",
  "Tickets": "/tickets",

  // ═══════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════
  "Notifications": "/notifications",
};

/**
 * Context-dependent paths
 * Some breadcrumbs like "Billing" or "Invoices" depend on their parent
 */
const CONTEXT_PATHS = {
  "Billing": {
    "Sales": "/Salesbilling",
    "Purchase": "/purchase-billing",
  },
  "Invoices": {
    "Sales": "/Salesinvoice",
    "Purchase": "/purchase-invoices",
  },
};

/**
 * Get the navigation path for a breadcrumb
 */
const getBreadcrumbPath = (crumb, allCrumbs, index) => {
  // Check direct mapping first
  if (BREADCRUMB_PATHS[crumb]) {
    return BREADCRUMB_PATHS[crumb];
  }

  // Check context-dependent paths
  if (CONTEXT_PATHS[crumb]) {
    const parent = allCrumbs[index - 1];
    if (parent && CONTEXT_PATHS[crumb][parent]) {
      return CONTEXT_PATHS[crumb][parent];
    }
  }

  return null;
};

const Breadcrumb = () => {
  const navigate = useNavigate();
  const breadcrumbs = useMenuStore((s) => s.breadcrumbs);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const crumbs = useMemo(() => {
    return breadcrumbs?.length > 0 ? breadcrumbs : ["Dashboard"];
  }, [breadcrumbs]);

  const handleCrumbClick = (crumb, index) => {
    const path = getBreadcrumbPath(crumb, crumbs, index);

    if (path) {
      const newBreadcrumbs = crumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      navigate(path);
    }
  };

  return (
    <nav 
      className="text-sm flex items-center gap-1.5 mb-3" 
      aria-label="Breadcrumb"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const path = getBreadcrumbPath(crumb, crumbs, index);
        const isClickable = !isLast && path;

        return (
          <span key={index} className="flex items-center gap-1.5">
            {isClickable ? (
              <button
                onClick={() => handleCrumbClick(crumb, index)}
                className="text-gray-400 hover:text-[#000060] transition-colors duration-150"
              >
                {crumb}
              </button>
            ) : (
              <span
                className={
                  isLast
                    ? "text-gray-700 font-medium"
                    : "text-gray-400"
                }
              >
                {crumb}
              </span>
            )}
            {!isLast && (
              <span className="text-gray-300 select-none">›</span>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;