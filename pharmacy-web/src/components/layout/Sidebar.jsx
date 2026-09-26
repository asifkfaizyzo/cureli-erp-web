// pharmacy-web/src/components/layout/Sidebar.jsx (do not remove this comment)
// src/components/layout/Sidebar.jsx

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useSubscriptionStore,
  selectNeedsRenewal,
} from "../../store/useSubscriptionStore";
import {
  useNotificationStore,
  selectNewOrderCount,
} from "../../store/useNotificationStore";
import {
  useAuthStore,
  selectIsSuperAdmin,
  selectIsGlobalMode,
} from "../../store/useAuthStore";
import usePrescriptionRequestAlertStore from "../../store/usePrescriptionRequestAlertStore";
import {
  LayoutGrid,
  Layers,
  FileText,
  ShoppingCart,
  Box,
  Users,
  Settings,
  ChevronDown,
  Building2,
  UserCircle,
  CreditCard,
  AlertTriangle,
  ShoppingBag,
  Store,
  PieChart,
  BarChart2,
  TrendingUp,
  RotateCcw,
  Wallet,
  AlertCircle,
  BookOpen,
  Clock,
  TrendingDown,
  Shield,
  Receipt,
  CircleDollarSign,
  Filter,       // Added to fix uncaught ReferenceError
  CheckCircle2, // Added to fix uncaught ReferenceError
  Activity,     // Added to fix uncaught ReferenceError
} from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";
import { useMenuPermissions } from "../../hooks/usePermission";
import { useAppMode } from "../../store/useAppModeStore";
import { useToast } from "../common/Toast";
import purchaseAPI from "../../api/purchase";

/* ─────────────── constants ─────────────── */
const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 260;

const SIDEBAR_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

const SUBMENU_VARIANTS = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

// ERP write routes — require BRANCH mode
const ERP_WRITE_ROUTES = ["/erp/sales-billing", "/erp/purchase-billing"];

/* ─────────────── Renewal Badge ─────────────── */
const RenewalBadge = ({ size = "sm", className = "" }) => {
  const sizeClasses = {
    xs: "w-3.5 h-3.5 text-[8px]",
    sm: "w-4 h-4 text-[9px]",
    md: "w-5 h-5 text-[10px]",
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        bg-red-500 text-white font-bold rounded-full
        ${sizeClasses[size]} ${className}
      `}
    >
      !
    </span>
  );
};

/* ─────────────── ERP MenuItem (Supports Nesting Accordion) ─────────────── */
const ERPMenuItem = ({
  item,
  activeMenu,
  isExpanded,
  openMenuId,
  onToggle,
  onNavigate,
  showRenewalBadge = false,
  isDisabled = false,
  disabledReason = "",
}) => {
  const Icon = item.icon;
  
  // Track open nested subcategories inside this parent menu item
  const [openCategoryId, setOpenCategoryId] = useState("");

  // Check if any standard submenu or nested child submenu item is active
  const isChildActive = useMemo(() => {
    return item.submenu?.some((sub) => {
      if (sub.items?.length > 0) {
        return sub.items.some((child) => child.id === activeMenu);
      }
      return sub.id === activeMenu;
    });
  }, [item.submenu, activeMenu]);

  const isActive = activeMenu === item.id || isChildActive;
  const isOpen = openMenuId === item.id;

  const isGlobalMode = useAuthStore(selectIsGlobalMode);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const needsRenewal = useSubscriptionStore(selectNeedsRenewal);

  const showBadgeOnIcon = showRenewalBadge && !isExpanded && !isActive;
  const showBadgeOnText = showRenewalBadge && isExpanded && !isActive;

  // Auto-expand nested category if one of its items becomes active
  useEffect(() => {
    if (isOpen && item.submenu) {
      const activeCategory = item.submenu.find((sub) =>
        sub.items?.some((child) => child.id === activeMenu)
      );
      if (activeCategory) {
        setOpenCategoryId(activeCategory.id);
      }
    }
  }, [activeMenu, isOpen, item.submenu]);

  const handleClick = (e) => {
    e.preventDefault();
    if (item.submenu?.length > 0) {
      onToggle(item.id);
    } else {
      onNavigate(item, isDisabled, disabledReason);
    }
  };

  return (
    <div className="flex flex-col">
      <motion.button
        onClick={handleClick}
        disabled={isDisabled && !item.submenu}
        className={`
          relative flex items-center w-full h-11 rounded-xl
          transition-colors duration-200
          ${
            isDisabled && !item.submenu
              ? "opacity-50 cursor-not-allowed bg-gray-50"
              : isActive
                ? "bg-[#05015A] text-white shadow-lg shadow-blue-900/20"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }
        `}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
      >
        <div className="absolute left-0 w-[56px] flex justify-center">
          <div className="relative">
            <Icon size={20} />
            {showBadgeOnIcon && (
              <span className="absolute -top-1.5 -right-1.5">
                <RenewalBadge size="xs" />
              </span>
            )}
            {isDisabled && !item.submenu && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full ring-2 ring-white flex items-center justify-center">
                <AlertTriangle size={8} className="text-white" />
              </span>
            )}
          </div>
        </div>

        <motion.span
          className="absolute left-[44px] text-sm font-medium whitespace-nowrap flex items-center gap-2"
          animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -12 }}
          transition={SIDEBAR_TRANSITION}
        >
          {item.label}
          {showBadgeOnText && <RenewalBadge size="sm" />}
        </motion.span>

        {item.submenu?.length > 0 && (
          <motion.div
            className="absolute right-3"
            animate={{ opacity: isExpanded ? 1 : 0, rotate: isOpen ? 180 : 0 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        )}

        {isDisabled && isExpanded && !item.submenu && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full"
          >
            SELECT BRANCH
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && item.submenu?.length > 0 && isOpen && (
          <motion.div
            variants={SUBMENU_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="ml-4 mt-1 pl-4 border-l border-gray-200 flex flex-col gap-1"
          >
            {item.submenu.map((sub) => {
              const SubIcon = sub.icon;
              const hasSubItems = sub.items?.length > 0;

              // ── CATEGORY ACCORDION ──
              if (hasSubItems) {
                const isCategoryOpen = openCategoryId === sub.id;
                const isCategoryActive = sub.items.some((child) => child.id === activeMenu);

                return (
                  <div key={sub.id} className="flex flex-col w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCategoryId((prev) => (prev === sub.id ? "" : sub.id));
                      }}
                      className={`
                        flex items-center w-full h-9 px-3 rounded-lg text-sm transition-all duration-150
                        ${
                          isCategoryActive
                            ? "bg-indigo-50 text-[#05015A] font-semibold"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <SubIcon size={16} className="mr-2 opacity-70" />
                      <span className="flex-1 text-left">{sub.label}</span>
                      <motion.div
                        animate={{ rotate: isCategoryOpen ? 180 : 0 }}
                        className="text-gray-400"
                      >
                        <ChevronDown size={14} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isCategoryOpen && (
                        <motion.div
                          variants={SUBMENU_VARIANTS}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="ml-4 pl-3 border-l border-gray-200 flex flex-col gap-1 mt-1"
                        >
                          {sub.items.map((subItem) => {
                            const SubItemIcon = subItem.icon;
                            const isSubItemActive = activeMenu === subItem.id;

                            return (
                              <motion.button
                                key={subItem.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate(subItem, false, "");
                                }}
                                className={`
                                  flex items-center h-8 px-3 rounded-lg text-xs transition-colors
                                  ${
                                    isSubItemActive
                                      ? "bg-blue-50 text-[#05015A] font-medium"
                                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                  }
                                `}
                                whileHover={{ x: 4 }}
                              >
                                <SubItemIcon size={14} className="mr-2 opacity-70" />
                                <span>{subItem.label}</span>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // ── STANDARD SUBMENU ITEM ──
              const isSubActive = activeMenu === sub.id;
              const subShowBadge =
                isSuperAdmin && needsRenewal && sub.id === "settings-profile";
              const hasBadge = sub.badge !== null && sub.badge !== undefined;
              const isSubWriteRoute = ERP_WRITE_ROUTES.includes(sub.path);
              const isSubDisabled =
                isSubWriteRoute && isSuperAdmin && isGlobalMode;

              return (
                <motion.button
                  key={sub.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(
                      sub,
                      isSubDisabled,
                      "Select a branch to create transactions",
                    );
                  }}
                  disabled={isSubDisabled}
                  className={`
                    flex items-center h-9 px-3 rounded-lg text-sm relative
                    ${
                      isSubDisabled
                        ? "opacity-50 cursor-not-allowed bg-gray-50/50"
                        : isSubActive
                          ? "bg-blue-50 text-[#05015A]"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                  whileHover={isSubDisabled ? {} : { x: 4 }}
                >
                  <div className="relative mr-2">
                    <SubIcon size={16} className="opacity-70" />
                    {isSubDisabled && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                  </div>
                  <span className="flex items-center gap-2 flex-1">
                    {sub.label}
                    {subShowBadge && <RenewalBadge size="sm" />}
                    {hasBadge && (
                      <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center animate-pulse">
                        {sub.badge}
                      </span>
                    )}
                  </span>
                  {isSubDisabled && (
                    <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded">
                      BRANCH
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────── Marketplace MenuItem ─────────────── */
const MarketplaceMenuItem = ({
  item,
  activeMenu,
  isExpanded,
  openMenuId,
  onToggle,
  onNavigate,
}) => {
  const Icon = item.icon;
  const isParent = item.submenu?.length > 0;
  const isChildActive = item.submenu?.some((sub) => sub.id === activeMenu);
  const isActive = activeMenu === item.id || isChildActive;
  const isOpen = openMenuId === item.id;

  const newOrderCount = useNotificationStore(selectNewOrderCount);
  const showOrderBadge = item.showOrderBadge && newOrderCount > 0;

  const pendingRequestIds = usePrescriptionRequestAlertStore(
    (s) => s.pendingRequestIds,
  );
  const requestRefreshCount = usePrescriptionRequestAlertStore(
    (s) => s.refreshCount,
  );
  const prescriptionCount = Math.max(
    Object.keys(pendingRequestIds).length,
    requestRefreshCount > 0 ? requestRefreshCount : 0,
  );
  const showPrescriptionBadge =
    item.showPrescriptionBadge && prescriptionCount > 0;

  const combinedCount = newOrderCount + prescriptionCount;
  const showAnyBadge = showOrderBadge || showPrescriptionBadge;

  const handleClick = (e) => {
    e.preventDefault();
    if (isParent) {
      onToggle(item.id);
    } else {
      onNavigate(item, false, "");
    }
  };

  return (
    <div className="flex flex-col">
      <motion.button
        onClick={handleClick}
        className={`
          relative flex items-center w-full h-11 rounded-xl
          transition-colors duration-200
          ${
            isActive
              ? "bg-white/[0.12] text-white shadow-lg shadow-black/30"
              : "text-white/50 hover:bg-white/[0.07] hover:text-white/90"
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute left-0 w-[56px] flex justify-center">
          <div className="relative">
            <Icon size={20} />
            {showAnyBadge && !isExpanded && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {combinedCount > 99 ? "99+" : combinedCount}
              </span>
            )}
          </div>
        </div>

        <motion.span
          className="absolute left-[44px] text-sm font-medium whitespace-nowrap flex items-center gap-2"
          animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -12 }}
          transition={SIDEBAR_TRANSITION}
        >
          {item.label}

          {showOrderBadge && isExpanded && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center animate-pulse">
              {newOrderCount > 99 ? "99+" : newOrderCount}
            </span>
          )}

          {showPrescriptionBadge && isExpanded && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center animate-pulse">
              {prescriptionCount > 99 ? "99+" : prescriptionCount}
            </span>
          )}
        </motion.span>

        {isParent && (
          <motion.div
            className="absolute right-3"
            animate={{ opacity: isExpanded ? 1 : 0, rotate: isOpen ? 180 : 0 }}
          >
            <ChevronDown size={16} className="text-white/40" />
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && isParent && isOpen && (
          <motion.div
            variants={SUBMENU_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="ml-4 mt-1 pl-4 border-l border-white/10 flex flex-col gap-1"
          >
            {item.submenu.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeMenu === sub.id;

              return (
                <motion.button
                  key={sub.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(sub, false, "");
                  }}
                  className={`
                    flex items-center h-9 px-3 rounded-lg text-sm
                    ${
                      isSubActive
                        ? "bg-white/[0.12] text-white"
                        : "text-white/40 hover:bg-white/[0.07] hover:text-white/80"
                    }
                  `}
                  whileHover={{ x: 4 }}
                >
                  <SubIcon size={16} className="mr-2 opacity-70" />
                  <span>{sub.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────── Main Sidebar ─────────────── */
const Sidebar = () => {
  const [hovered, setHovered] = useState(false);
  const [openMenuId, setOpenMenuId] = useState("");
  const [pendingReturnsCount, setPendingReturnsCount] = useState(0);

  const isManualToggle = useRef(false);

  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const permissions = useMenuPermissions();
  const { isMarketplace } = useAppMode();

  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);
  const needsRenewal = useSubscriptionStore(selectNeedsRenewal);
  const loadSubscriptionStatus = useSubscriptionStore(
    (s) => s.loadSubscriptionStatus,
  );

  const isExpanded = hovered;

  // Load pending returns count (ERP only)
  useEffect(() => {
    if (isMarketplace) return;

    const loadPendingReturnsCount = async () => {
      try {
        const response = await purchaseAPI.getAllReturns({
          approvalStatus: "PENDING_APPROVAL",
          limit: 1000,
        });
        setPendingReturnsCount(response.data?.total || 0);
      } catch {
        setPendingReturnsCount(0);
      }
    };

    loadPendingReturnsCount();

    let interval;
    if (isSuperAdmin) {
      interval = setInterval(loadPendingReturnsCount, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSuperAdmin, isMarketplace]);

  useEffect(() => {
    if (isSuperAdmin) loadSubscriptionStatus();
  }, [isSuperAdmin, loadSubscriptionStatus]);

  /* ─────────── ERP menu config ─────────── */
  const erpMenuItems = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutGrid,
        path: "/erp/dashboard",
        breadcrumbs: ["Dashboard"],
        permissionKey: "dashboard",
      },
      {
        id: "sales",
        label: "Sales",
        icon: Layers,
        permissionKey: "salesBilling",
        submenu: [
          {
            id: "sales-billing",
            label: "Billing",
            icon: FileText,
            path: "/erp/sales-billing",
            breadcrumbs: ["Sales", "Billing"],
            permissionKey: "salesBilling",
            isWriteRoute: true,
          },
          {
            id: "sales-invoices",
            label: "Invoices",
            icon: BarChart2,
            path: "/erp/sales-invoice",
            breadcrumbs: ["Sales", "Invoices"],
            permissionKey: "salesInvoices",
          },
          {
            id: "sales-returns",
            label: "Returns",
            icon: RotateCcw,
            path: "/erp/sales-returns",
            breadcrumbs: ["Sales", "Returns"],
            permissionKey: "salesReturns",
            badge: pendingReturnsCount > 0 ? pendingReturnsCount : null,
          },
        ],
      },
      {
        id: "purchase",
        label: "Purchase",
        icon: ShoppingCart,
        permissionKey: "purchaseBilling",
        submenu: [
          {
            id: "purchase-billing",
            label: "Billing",
            icon: FileText,
            path: "/erp/purchase-billing",
            breadcrumbs: ["Purchase", "Billing"],
            permissionKey: "purchaseBilling",
            isWriteRoute: true,
          },
          {
            id: "purchase-invoices",
            label: "Invoices",
            icon: BarChart2,
            path: "/erp/purchase-invoices",
            breadcrumbs: ["Purchase", "Invoices"],
            permissionKey: "purchaseInvoices",
          },
          {
            id: "purchase-returns",
            label: "Returns",
            icon: RotateCcw,
            path: "/erp/purchase-returns",
            breadcrumbs: ["Purchase", "Returns"],
            permissionKey: "purchaseReturns",
            badge: pendingReturnsCount > 0 ? pendingReturnsCount : null,
          },
        ],
      },
      {
        id: "inventory",
        label: "Inventory",
        icon: Box,
        path: "/erp/inventory",
        breadcrumbs: ["Inventory"],
        permissionKey: "inventory",
      },
      {
        id: "reports",
        label: "Reports",
        icon: PieChart,
        permissionKey: "salesReport",
        submenu: [
          {
            id: "reports-sales",
            label: "Sales Reports",
            icon: BarChart2,
            permissionKey: "salesReport",
            items: [
              {
                id: "report-sales-summary",
                label: "Sales Summary",
                icon: BarChart2,
                path: "/erp/reports/sales/summary",
                breadcrumbs: ["Reports", "Sales Summary"],
                permissionKey: "salesReport",
              },
              {
                id: "report-sales-register",
                label: "Sales Register",
                icon: FileText,
                path: "/erp/reports/sales/register",
                breadcrumbs: ["Reports", "Sales Register"],
                permissionKey: "salesReport",
              },
              {
                id: "report-sales-profit",
                label: "Profit Report",
                icon: TrendingUp,
                path: "/erp/reports/sales/profit",
                breadcrumbs: ["Reports", "Profit Report"],
                permissionKey: "salesReport",
              },
              {
                id: "report-sales-returns",
                label: "Sales Returns",
                icon: RotateCcw,
                path: "/erp/reports/sales/returns",
                breadcrumbs: ["Reports", "Sales Returns"],
                permissionKey: "salesReport",
              },
              {
                id: "report-sales-payments",
                label: "Payment Collection",
                icon: Wallet,
                path: "/erp/reports/sales/payments",
                breadcrumbs: ["Reports", "Payment Collection"],
                permissionKey: "salesReport",
              },
              {
                id: "report-sales-outstanding",
                label: "Outstanding",
                icon: AlertCircle,
                path: "/erp/reports/sales/outstanding",
                breadcrumbs: ["Reports", "Outstanding & Receivables"],
                permissionKey: "salesReport",
              },
              {
                id: "report-daybook",
                label: "Day Book",
                icon: BookOpen,
                path: "/erp/reports/sales/daybook",
                breadcrumbs: ["Reports", "Day Book"],
                permissionKey: "salesReport",
              },
            ],
          },
          {
            id: "reports-purchase",
            label: "Purchase Reports",
            icon: ShoppingCart,
            permissionKey: "purchaseBilling",
            items: [
              {
                id: "report-purchase-register",
                label: "Purchase Register",
                icon: FileText,
                path: "/erp/reports/purchase/register",
                breadcrumbs: ["Reports", "Purchase Register"],
                permissionKey: "purchaseBilling",
              },
              {
                id: "report-purchase-outstanding",
                label: "Outstanding & Payables",
                icon: AlertCircle,
                path: "/erp/reports/purchase/outstanding",
                breadcrumbs: ["Reports", "Purchase Outstanding"],
                permissionKey: "purchaseBilling",
              },
              {
                id: "report-purchase-returns",
                label: "Purchase Returns",
                icon: RotateCcw,
                path: "/erp/reports/purchase/returns",
                breadcrumbs: ["Reports", "Purchase Returns"],
                permissionKey: "purchaseBilling",
              },
            ],
          },
          {
            id: "reports-inventory",
            label: "Inventory Reports",
            icon: Box,
            permissionKey: "inventory",
            items: [
              {
                id: "report-current-stock",
                label: "Current Stock",
                icon: Layers,
                path: "/erp/reports/inventory/current-stock",
                breadcrumbs: ["Reports", "Current Stock"],
                permissionKey: "inventory",
              },
              {
                id: "report-expiry",
                label: "Expiry Report",
                icon: Clock,
                path: "/erp/reports/inventory/expiry",
                breadcrumbs: ["Reports", "Expiry Report"],
                permissionKey: "inventory",
              },
              {
                id: "report-min-stock",
                label: "Min Stock & Reorder",
                icon: AlertTriangle,
                path: "/erp/reports/inventory/min-stock",
                breadcrumbs: ["Reports", "Min Stock & Reorder"],
                permissionKey: "inventory",
              },
              {
                id: "report-dead-stock",
                label: "Dead Stock",
                icon: TrendingDown,
                path: "/erp/reports/inventory/dead-stock",
                breadcrumbs: ["Reports", "Dead Stock"],
                permissionKey: "inventory",
              },
              {
                id: "report-stock-adjustments",
                label: "Stock Adjustments",
                icon: Shield,
                path: "/erp/reports/inventory/adjustments",
                breadcrumbs: ["Reports", "Stock Adjustments"],
                permissionKey: "inventory",
              },
            ],
          },
          {
            id: "reports-gst",
            label: "GST Reports",
            icon: Receipt,
            permissionKey: "salesReport",
            items: [
              {
                id: "report-gst-gstr1",
                label: "GSTR-1 Outward",
                icon: FileText,
                path: "/erp/reports/gst/gstr1",
                breadcrumbs: ["Reports", "GSTR-1 Outward Supply"],
                permissionKey: "salesReport",
              },
              {
                id: "report-gst-gstr2",
                label: "GSTR-2 Inward",
                icon: FileText,
                path: "/erp/reports/gst/gstr2",
                breadcrumbs: ["Reports", "GSTR-2 Inward Supply"],
                permissionKey: "purchaseBilling",
              },
              {
                id: "report-gst-gstr3b",
                label: "GSTR-3B Summary",
                icon: Receipt,
                path: "/erp/reports/gst/gstr3b",
                breadcrumbs: ["Reports", "GSTR-3B Monthly Summary"],
                permissionKey: "salesReport",
              },
            ],
          },
          {
            id: "reports-financial",
            label: "Financial Reports",
            icon: CircleDollarSign,
            permissionKey: "salesReport",
            items: [
              {
                id: "report-financial-medicine",
                label: "Medicine-wise P&L",
                icon: TrendingUp,
                path: "/erp/reports/financial/medicine-pl",
                breadcrumbs: ["Reports", "Medicine-wise P&L"],
                permissionKey: "salesReport",
              },
              {
                id: "report-financial-period",
                label: "Period-wise P&L",
                icon: CircleDollarSign,
                path: "/erp/reports/financial/period-pl",
                breadcrumbs: ["Reports", "Period-wise P&L"],
                permissionKey: "salesReport",
              },
            ],
          },
          {
            id: "reports-marketplace",
            label: "Marketplace Reports",
            icon: ShoppingBag,
            permissionKey: "salesReport",
            items: [
              {
                id: "report-mkt-sales-summary",
                label: "Sales Summary",
                icon: BarChart2,
                path: "/erp/reports/marketplace/sales-summary",
                breadcrumbs: ["Reports", "Marketplace Sales Summary"],
                permissionKey: "salesReport",
              },
              {
                id: "report-mkt-order-funnel",
                label: "Order Status Funnel",
                icon: Filter,
                path: "/erp/reports/marketplace/order-funnel",
                breadcrumbs: ["Reports", "Order Status Funnel"],
                permissionKey: "salesReport",
              },
              {
                id: "report-mkt-acceptance-rate",
                label: "Acceptance Rate",
                icon: CheckCircle2,
                path: "/erp/reports/marketplace/acceptance-rate",
                breadcrumbs: ["Reports", "Acceptance Rate"],
                permissionKey: "salesReport",
              },
              {
                id: "report-mkt-prescription-summary",
                label: "Prescription Requests",
                icon: FileText,
                path: "/erp/reports/marketplace/prescription-summary",
                breadcrumbs: ["Reports", "Prescription Request Summary"],
                permissionKey: "salesReport",
              },
              {
                id: "report-mkt-listing-health",
                label: "Listing Health",
                icon: Activity,
                path: "/erp/reports/marketplace/listing-health",
                breadcrumbs: ["Reports", "Listing Health"],
                permissionKey: "salesReport",
              },
            ],
          },
        ],
      },
      {
        id: "suppliers",
        label: "Suppliers",
        icon: Users,
        path: "/erp/suppliers",
        breadcrumbs: ["Suppliers"],
        permissionKey: "suppliers",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        permissionKey: "settings",
        submenu: [
          {
            id: "settings-users",
            label: "Users",
            icon: Users,
            path: "/erp/settings/users",
            breadcrumbs: ["Settings", "Users"],
            permissionKey: "settingsUsers",
          },
          {
            id: "settings-branches",
            label: "Branches",
            icon: Building2,
            path: "/erp/settings/branches",
            breadcrumbs: ["Settings", "Branches"],
            permissionKey: "settingsBranches",
          },
          {
            id: "settings-profile",
            label: "Profile",
            icon: UserCircle,
            path: "/erp/settings/profile",
            breadcrumbs: ["Settings", "Profile"],
            permissionKey: "settingsProfile",
          },
          {
            id: "settings-upgrade",
            label: "Plans",
            icon: CreditCard,
            path: "/erp/settings/upgrade",
            breadcrumbs: ["Settings", "Profile", "Plans"],
            permissionKey: "settingsUpgrade",
            hidden: true,
          },
        ],
      },
    ],
    [pendingReturnsCount],
  );

  /* ─────────── Marketplace menu config ─────────── */
  const marketplaceMenuItems = useMemo(
    () => [
      {
        id: "marketplace-dashboard",
        label: "Dashboard",
        icon: LayoutGrid,
        path: "/marketplace/dashboard",
        breadcrumbs: ["Marketplace", "Dashboard"],
        permissionKey: "marketplaceDashboard",
      },
      {
        id: "marketplace-orders",
        label: "Orders",
        icon: ShoppingBag,
        path: "/marketplace/orders",
        breadcrumbs: ["Marketplace", "Orders"],
        permissionKey: "marketplaceOrders",
        showOrderBadge: true,
        showPrescriptionBadge: true,
      },
      {
        id: "marketplace-listings",
        label: "Medicine Listings",
        icon: Box,
        path: "/marketplace/listings",
        breadcrumbs: ["Marketplace", "Medicine Listings"],
        permissionKey: "marketplaceListings",
      },
      {
        id: "marketplace-storefront",
        label: "Storefront",
        icon: Store,
        path: "/marketplace/storefront",
        breadcrumbs: ["Marketplace", "Storefront"],
        permissionKey: "marketplaceStorefront",
      },
    ],
    [],
  );

  const allMenuItems = isMarketplace ? marketplaceMenuItems : erpMenuItems;

  /* ─────────── Permission filtering ─────────── */
  const visibleMenuItems = useMemo(() => {
    if (isMarketplace) {
      return marketplaceMenuItems.filter((item) => {
        const p = permissions[item.permissionKey];
        return p?.visible !== false;
      });
    }

    return erpMenuItems
      .map((item) => {
        if (item.submenu?.length > 0) {
          const visibleSubmenu = item.submenu
            .map((sub) => {
              if (sub.hidden) return null;
              if (sub.items?.length > 0) {
                const visibleItems = sub.items.filter((child) => {
                  if (child.hidden) return false;
                  const itemPerm = permissions[child.permissionKey];
                  return itemPerm?.visible !== false && !itemPerm?.disabled;
                });
                if (visibleItems.length === 0) return null;
                return { ...sub, items: visibleItems };
              }
              const subPerm = permissions[sub.permissionKey];
              if (subPerm?.visible === false || subPerm?.disabled) return null;
              return sub;
            })
            .filter(Boolean);

          if (visibleSubmenu.length === 0) return null;
          return { ...item, submenu: visibleSubmenu };
        }
        if (item.hidden) return null;
        const itemPerm = permissions[item.permissionKey];
        if (itemPerm?.visible === false || itemPerm?.disabled) return null;
        return item;
      })
      .filter(Boolean);
  }, [isMarketplace, erpMenuItems, marketplaceMenuItems, permissions]);

  /* ─────────── Accessible items list ─────────── */
  const allAccessibleItems = useMemo(() => {
    if (isMarketplace) return marketplaceMenuItems;

    return erpMenuItems
      .map((item) => {
        if (item.submenu?.length > 0) {
          const accessible = item.submenu
            .map((sub) => {
              if (sub.items?.length > 0) {
                const accessibleChildren = sub.items.filter((child) => {
                  const p = permissions[child.permissionKey];
                  return p?.visible !== false && !p?.disabled;
                });
                if (accessibleChildren.length === 0) return null;
                return { ...sub, items: accessibleChildren };
              }
              const p = permissions[sub.permissionKey];
              if (p?.visible === false || p?.disabled) return null;
              return sub;
            })
            .filter(Boolean);

          if (accessible.length === 0) return null;
          return { ...item, submenu: accessible };
        }
        const p = permissions[item.permissionKey];
        if (p?.visible === false || p?.disabled) return null;
        return item;
      })
      .filter(Boolean);
  }, [isMarketplace, erpMenuItems, marketplaceMenuItems, permissions]);

  /* ─────────── Navigation handler ─────────── */
  const handleNavigation = useCallback(
    (item, isDisabled = false, disabledReason = "") => {
      if (isDisabled) {
        toast.warning(
          "Branch Required",
          disabledReason ||
            "Please select a specific branch to access this feature",
        );
        return;
      }
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
    },
    [navigate, setActiveMenu, setBreadcrumbs, toast],
  );

  const handleToggleSubmenu = useCallback((id) => {
    isManualToggle.current = true;
    setOpenMenuId((prev) => (prev === id ? "" : id));
    setTimeout(() => {
      isManualToggle.current = false;
    }, 100);
  }, []);

  /* ─────────── Sync active menu from URL ─────────── */
  useEffect(() => {
    const currentPath = location.pathname;
    for (const item of allAccessibleItems) {
      if (item.path === currentPath) {
        setActiveMenu(item.id);
        setBreadcrumbs(item.breadcrumbs);
        return;
      }
      if (item.submenu) {
        for (const sub of item.submenu) {
          if (sub.path === currentPath) {
            setActiveMenu(sub.id);
            setBreadcrumbs(sub.breadcrumbs);
            setOpenMenuId(item.id);
            return;
          }
          if (sub.items) {
            const subItem = sub.items.find((si) => si.path === currentPath);
            if (subItem) {
              setActiveMenu(subItem.id);
              setBreadcrumbs(subItem.breadcrumbs);
              setOpenMenuId(item.id);
              return;
            }
          }
        }
      }
    }
  }, [location.pathname, allAccessibleItems, setActiveMenu, setBreadcrumbs]);

  /* ─────────── Auto-open parent submenu ─────────── */
  useEffect(() => {
    if (isManualToggle.current) return;
    const parent = allAccessibleItems.find((m) =>
      m.submenu?.some((s) => {
        if (s.items?.length > 0) {
          return s.items.some((child) => child.id === activeMenu);
        }
        return s.id === activeMenu;
      })
    );
    if (parent && openMenuId !== parent.id) {
      setOpenMenuId(parent.id);
    }
  }, [activeMenu, allAccessibleItems, openMenuId]);

  /* ─────────── Fallback navigation if activeMenu invalid ─────────── */
  useEffect(() => {
    const isValid =
      allAccessibleItems.some((m) => m.id === activeMenu) ||
      allAccessibleItems.some((m) =>
        m.submenu?.some((s) => {
          if (s.items?.length > 0) {
            return s.items.some((child) => child.id === activeMenu);
          }
          return s.id === activeMenu;
        })
      );

    if (!isValid && allAccessibleItems.length > 0) {
      const isOnCorrectNamespace = isMarketplace
        ? location.pathname.startsWith("/marketplace")
        : location.pathname.startsWith("/erp");

      if (!isOnCorrectNamespace) return;

      const activeMenuIsFromERP = erpMenuItems.some(
        (m) =>
          m.id === activeMenu ||
          m.submenu?.some((s) => {
            if (s.items?.length > 0) {
              return s.items.some((child) => child.id === activeMenu);
            }
            return s.id === activeMenu;
          })
      );
      const activeMenuIsFromMarketplace = marketplaceMenuItems.some(
        (m) => m.id === activeMenu,
      );

      if (isMarketplace && activeMenuIsFromERP) return;
      if (!isMarketplace && activeMenuIsFromMarketplace) return;

      const defaultId = isMarketplace ? "marketplace-dashboard" : "dashboard";
      const fallbackItem =
        allAccessibleItems.find((m) => m.id === defaultId) ||
        allAccessibleItems[0];

      if (fallbackItem) {
        if (fallbackItem.submenu?.length > 0) {
          const firstSub = fallbackItem.submenu[0];
          if (firstSub.items?.length > 0) {
            const firstChild = firstSub.items[0];
            setActiveMenu(firstChild.id);
            setBreadcrumbs(firstChild.breadcrumbs);
            navigate(firstChild.path);
          } else {
            setActiveMenu(firstSub.id);
            setBreadcrumbs(firstSub.breadcrumbs);
            navigate(firstSub.path);
          }
        } else {
          setActiveMenu(fallbackItem.id);
          setBreadcrumbs(fallbackItem.breadcrumbs);
          navigate(fallbackItem.path);
        }
      }
    }
  }, [
    activeMenu,
    allAccessibleItems,
    navigate,
    setActiveMenu,
    setBreadcrumbs,
    isMarketplace,
    location.pathname,
    erpMenuItems,
    marketplaceMenuItems,
  ]);

  /* ─────────── Render ─────────── */
  return (
    <motion.aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        h-screen mt-16
        border-r overflow-hidden flex flex-col flex-shrink-0 will-change-[width]
        ${
          isMarketplace
            ? "bg-[#010015] border-white/[0.06]"
            : "bg-white border-gray-200"
        }
      `}
      animate={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={SIDEBAR_TRANSITION}
    >
      {isMarketplace && (
        <div className="px-2 pt-4 pb-2">
          <motion.div
            className="flex items-center h-8 rounded-lg bg-white/[0.06] overflow-hidden"
            animate={{ opacity: 1 }}
          >
            <div className="w-[56px] flex justify-center flex-shrink-0">
              <Store size={14} className="text-white/40" />
            </div>
            <motion.span
              className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap"
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={SIDEBAR_TRANSITION}
            >
              Marketplace
            </motion.span>
          </motion.div>
        </div>
      )}

      <nav className="flex flex-col gap-2 pt-4 px-2 pb-4 overflow-y-auto sidebar-nav">
        {visibleMenuItems.map((item) => {
          if (isMarketplace) {
            return (
              <MarketplaceMenuItem
                key={item.id}
                item={item}
                activeMenu={activeMenu}
                isExpanded={isExpanded}
                openMenuId={openMenuId}
                onToggle={handleToggleSubmenu}
                onNavigate={handleNavigation}
              />
            );
          }

          const showRenewalBadge =
            isSuperAdmin && needsRenewal && item.id === "settings";
          const isWriteRoute = ERP_WRITE_ROUTES.includes(item.path);
          const isDisabled = isWriteRoute && isSuperAdmin && isGlobalMode;

          return (
            <ERPMenuItem
              key={item.id}
              item={item}
              activeMenu={activeMenu}
              isExpanded={isExpanded}
              openMenuId={openMenuId}
              onToggle={handleToggleSubmenu}
              onNavigate={handleNavigation}
              showRenewalBadge={showRenewalBadge}
              isDisabled={isDisabled}
              disabledReason="Select a branch to create transactions"
            />
          );
        })}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;