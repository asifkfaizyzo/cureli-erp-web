// pharmacy-web/src/components/layout/TopHeader.jsx (do not remove this comment)
// src/components/layout/TopHeader.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Clock,
  Calendar,
  User,
  Headphones,
  Shield,
  Building2,
  Store,
  Loader2,
  Check,
  CreditCard,
  Layers,
} from "lucide-react";
import logo from "../../assets/icons/curelinew.svg";
import logoWhite from "../../assets/icons/cureliwhitenew.svg";
import { useAppMode, useAppModeStore } from "../../store/useAppModeStore";
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
  selectIsGlobalMode,
  BRANCH_MODE,
} from "../../store/useAuthStore";
import {
  useNotificationStore,
  selectNewOrderCount,
} from "../../store/useNotificationStore";
import { useMenuStore } from "../../store/useMenuStore";
import { usePermission } from "../../hooks/usePermission";
import { PERMISSIONS } from "../../config/permissions";
import { logoutUser } from "../../api/auth";
import { fetchBranchesDropdown, switchBranch } from "../../api/branches";
import ConfirmDialog from "../common/ConfirmDialog";
import {
  useSubscriptionStore,
  selectNeedsRenewal,
  selectDaysRemaining,
  selectIsInGrace,
} from "../../store/useSubscriptionStore";
import { useToast } from "../common/Toast";
import { NotificationDropdown } from "../common/notifications";
import { useSSENotifications } from "../../hooks/useSSENotifications";

const WRITE_ROUTES = ["/erp/sales-billing", "/erp/purchase-billing"];

const AuthenticatedTopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const newOrderCount = useNotificationStore(selectNewOrderCount);
  useSSENotifications();

  const profileRef = useRef(null);
  const branchRef = useRef(null);

  const user = useAuthStore((state) => state.user);
  const shopName = useAuthStore((state) => state.shopName);
  const logout = useAuthStore((state) => state.logout);
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);
  const setGlobalBranch = useAuthStore((state) => state.setGlobalBranch);
  const setBranch = useAuthStore((state) => state.setBranch);

  const needsRenewal = useSubscriptionStore(selectNeedsRenewal);
  const daysRemaining = useSubscriptionStore(selectDaysRemaining);
  const isInGrace = useSubscriptionStore(selectIsInGrace);
  const loadSubscriptionStatus = useSubscriptionStore(
    (s) => s.loadSubscriptionStatus,
  );

  const shopId = user?.shop_id || null;
  const userRole = user?.role || null;

  const { hasPermission } = usePermission();

  const { isERP, isMarketplace } = useAppMode();
  const setAppMode = useAppModeStore((s) => s.setAppMode);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const handleSwitchToERP = () => {
    setAppMode("ERP");
    setActiveMenu("dashboard");
    setBreadcrumbs(["Dashboard"]);
    setTimeout(() => navigate("/erp/dashboard"), 50);
  };

  const handleSwitchToMarketplace = () => {
    setAppMode("MARKETPLACE");
    setActiveMenu("marketplace-dashboard");
    setBreadcrumbs(["Marketplace", "Dashboard"]);
    setTimeout(() => navigate("/marketplace/dashboard"), 50);
  };

  const [dateTime, setDateTime] = useState({ time: "", date: "", day: "" });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);
  const [branches, setBranches] = useState([]);

  const canSwitchBranches = hasPermission(PERMISSIONS.BRANCHES_SWITCH);

  const isOnWriteRoute = useMemo(
    () => WRITE_ROUTES.includes(location.pathname),
    [location.pathname],
  );

  const roleConfig = {
    super_admin: {
      label: "Super Admin",
      color: isMarketplace
        ? "bg-purple-900/50 text-purple-300"
        : "bg-purple-100 text-purple-700",
      icon: Shield,
    },
    branch_admin: {
      label: "Branch Admin",
      color: isMarketplace
        ? "bg-blue-900/50 text-blue-300"
        : "bg-blue-100 text-blue-700",
      icon: Building2,
    },
    staff: {
      label: "Staff",
      color: isMarketplace
        ? "bg-slate-800 text-slate-300"
        : "bg-slate-100 text-slate-700",
      icon: User,
    },
  };

  const currentRole = roleConfig[userRole] || roleConfig.staff;

  const userName = user?.name?.trim() || "User";
  const userHandle = user?.username?.trim() || "";

  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const sortedBranches = useMemo(() => {
    if (!branches.length) return [];
    return [...branches].sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return a.branch_name.localeCompare(b.branch_name);
    });
  }, [branches]);

  const selectedBranchId =
    branchContext.mode === BRANCH_MODE.BRANCH ? branchContext.branch_id : null;

  const selectedBranch = selectedBranchId
    ? branches.find((b) => b.branch_id === selectedBranchId)
    : null;

  const isAllBranches = isSuperAdmin && isGlobalMode;

  const displayBranchName = useMemo(() => {
    if (isSuperAdmin) {
      if (isAllBranches) return "All Branches";
      return (
        selectedBranch?.branch_name ||
        branchContext.branch_name ||
        "Select Branch"
      );
    }
    return branchContext.branch_name || "My Branch";
  }, [isSuperAdmin, isAllBranches, selectedBranch, branchContext.branch_name]);

  const displayShopName = shopName || "My Business";

  const fetchBranchesData = useCallback(async () => {
    if (!canSwitchBranches || !shopId) return;
    setIsBranchesLoading(true);
    try {
      const response = await fetchBranchesDropdown();
      const branchList = response?.data?.branches || [];
      setBranches(branchList);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      setBranches([]);
    } finally {
      setIsBranchesLoading(false);
    }
  }, [canSwitchBranches, shopId]);

  // Clock
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setDateTime({
        time: now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        date: now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        day: now.toLocaleDateString("en-IN", { weekday: "long" }),
      });
    };
    updateDateTime();
    const id = setInterval(updateDateTime, 1000);
    return () => clearInterval(id);
  }, []);

  // Branches
  useEffect(() => {
    if (canSwitchBranches && shopId) fetchBranchesData();
  }, [canSwitchBranches, shopId, fetchBranchesData]);

  // Subscription
  useEffect(() => {
    if (isSuperAdmin && shopId) loadSubscriptionStatus();
  }, [isSuperAdmin, shopId, loadSubscriptionStatus]);

  // Click-outside
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setShowProfileMenu(false);
      if (branchRef.current && !branchRef.current.contains(e.target))
        setShowBranchSelector(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setShowProfileMenu(false);
        setShowBranchSelector(false);
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelectAllBranches = () => {
    setShowBranchSelector(false);
    if (isOnWriteRoute) {
      navigate("/erp/dashboard");
      setGlobalBranch();
      toast.info(
        "Switched to All Branches",
        "Select a specific branch to create bills or purchases",
      );
    } else {
      setGlobalBranch();
    }
  };

  const handleBranchChange = async (branch) => {
    if (branch.branch_id === selectedBranchId) {
      setShowBranchSelector(false);
      return;
    }
    setIsSwitchingBranch(true);
    try {
      const response = await switchBranch(branch.branch_id);
      if (response.success) {
        setBranch(branch.branch_id, response.data.branch_name);
        setShowBranchSelector(false);
      }
    } catch (error) {
      console.error("Failed to switch branch:", error);
    } finally {
      setIsSwitchingBranch(false);
    }
  };

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    setShowLogoutConfirm(true);
  };
  const handleLogoutCancel = () => setShowLogoutConfirm(false);
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      setShowLogoutConfirm(false);
      logout();
      navigate("/login", { replace: true });
    }
  };

  const Divider = () => (
    <div
      className={`w-px h-8 ${isMarketplace ? "bg-white/10" : "bg-gray-200"}`}
    />
  );

  const RenewalPill = () => {
    if (!isSuperAdmin || !needsRenewal) return null;
    const isUrgent = daysRemaining <= 7 || isInGrace;
    return (
      <button
        onClick={() => navigate("/erp/settings/upgrade")}
        className={`
          flex items-center gap-2 h-10 px-3 rounded-lg
          border transition-all duration-150 font-medium text-sm
          ${
            isUrgent
              ? "bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30"
              : "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
          }
        `}
      >
        <CreditCard size={15} />
        <span className="hidden sm:block">
          {isInGrace
            ? "Grace Period"
            : `Plan: ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`}
        </span>
        {isUrgent && (
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
        )}
      </button>
    );
  };

  const headerBg = isMarketplace
    ? "bg-[#010015] border-white/[0.06]"
    : "bg-white border-gray-200/80";

  const textPrimary = isMarketplace ? "text-white" : "text-gray-800";
  const textSecondary = isMarketplace ? "text-white/50" : "text-gray-500";
  const textMuted = isMarketplace ? "text-white/30" : "text-gray-400";

  const branchButtonBase = isMarketplace
    ? `border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 ${showBranchSelector ? "border-white/20 bg-white/10" : ""}`
    : `border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 ${showBranchSelector ? "border-[#000060]/30 bg-[#000060]/[0.03]" : ""}`;

  const dropdownBg = isMarketplace
    ? "bg-[#0d0a3a] border-white/10 shadow-2xl shadow-black/50"
    : "bg-white border-gray-200 shadow-lg";

  const dropdownHeaderBg = isMarketplace
    ? "bg-white/5 border-white/10"
    : "bg-gray-50/80 border-gray-100";

  const dropdownItemHover = isMarketplace
    ? "hover:bg-white/5"
    : "hover:bg-gray-50";
  const dropdownItemActive = isMarketplace
    ? "bg-white/10"
    : "bg-[#000060]/[0.04]";
  const dropdownFooterBg = isMarketplace
    ? "bg-white/5 border-white/10"
    : "bg-gray-50/50 border-gray-100";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 border-b shadow-sm ${headerBg}`}
      >
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* ── LEFT ── */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src={isMarketplace ? logoWhite : logo}
                alt="Cureli"
                className="h-9 w-auto sm:h-10"
              />
              <div className="hidden sm:flex flex-col">
                <span
                  className={`text-xl font-bold leading-tight ${
                    isMarketplace ? "text-white" : "text-[#000060]"
                  }`}
                >
                  Cureli
                </span>
                <span
                  className={`text-[10px] font-medium -mt-0.5 ${textMuted}`}
                >
                  {isMarketplace ? "Mobile Delivery" : "Pharmacy ERP"}
                </span>
              </div>
            </div>

            <div
              className={`hidden md:block w-px h-8 ml-1 ${
                isMarketplace ? "bg-white/10" : "bg-gray-200"
              }`}
            />

            <div
              className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                isMarketplace
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <Store
                size={14}
                className={isMarketplace ? "text-white/50" : "text-[#000060]"}
              />
              <span
                className={`text-sm font-medium max-w-[320px] truncate ${
                  isMarketplace ? "text-white/70" : "text-gray-700"
                }`}
              >
                {displayShopName}
              </span>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Date / Time */}
            <div className="items-center gap-2">
              <div className={`flex items-center gap-1 ${textSecondary}`}>
                <Calendar size={12} />
                <span className="text-xs font-normal">{dateTime.date}</span>
              </div>
              <div className={`flex items-center gap-1 ${textSecondary}`}>
                <Clock size={12} />
                <span className="text-xs font-normal tabular-nums">
                  {dateTime.time}
                </span>
              </div>
            </div>

            {/* Mode Switcher */}
            <div
              className={`flex items-center rounded-lg p-0.5 gap-0.5 ${
                isMarketplace ? "bg-white/10" : "bg-gray-100"
              }`}
            >
              <button
                onClick={handleSwitchToERP}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150
                  ${
                    isERP
                      ? isMarketplace
                        ? "bg-white/10 text-white shadow-sm"
                        : "bg-white text-[#05015A] shadow-sm"
                      : isMarketplace
                        ? "text-white/40 hover:text-white/70"
                        : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                ERP
              </button>

              {/* ── Marketplace mode switcher button with new order badge ── */}
              <button
                onClick={handleSwitchToMarketplace}
                className={`
                  relative px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150
                  ${
                    isMarketplace
                      ? "bg-white text-[#010015] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                Marketplace
                {/* New order badge — only show when NOT already in marketplace mode */}
                {!isMarketplace && newOrderCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {newOrderCount > 99 ? "99+" : newOrderCount}
                  </span>
                )}
              </button>
            </div>

            <Divider />

            {/* Branch selector */}
            {canSwitchBranches && (
              <div className="relative" ref={branchRef}>
                <button
                  onClick={() => setShowBranchSelector(!showBranchSelector)}
                  disabled={isSwitchingBranch}
                  className={`
                    flex items-center gap-2.5 h-10 px-3 rounded-lg border transition-all duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${branchButtonBase}
                  `}
                >
                  {isSwitchingBranch ? (
                    <Loader2
                      size={15}
                      className={`animate-spin ${isMarketplace ? "text-white/60" : "text-[#000060]"}`}
                    />
                  ) : isAllBranches ? (
                    <Layers
                      size={15}
                      className={
                        isMarketplace ? "text-white/60" : "text-[#000060]"
                      }
                    />
                  ) : (
                    <Building2
                      size={15}
                      className={
                        isMarketplace ? "text-white/60" : "text-[#000060]"
                      }
                    />
                  )}
                  <span
                    className={`hidden sm:block text-sm font-medium max-w-[110px] truncate ${
                      isMarketplace ? "text-white/70" : "text-gray-700"
                    }`}
                  >
                    {displayBranchName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-150 ${
                      showBranchSelector ? "rotate-180" : ""
                    } ${isMarketplace ? "text-white/30" : "text-gray-400"}`}
                  />
                </button>

                {showBranchSelector && (
                  <div
                    className={`absolute right-0 top-full mt-1.5 w-64 rounded-lg border overflow-hidden z-50 ${dropdownBg}`}
                  >
                    <div
                      className={`px-3 py-2.5 border-b ${dropdownHeaderBg}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${textSecondary}`}
                        >
                          Select Branch
                        </span>
                        {isBranchesLoading && (
                          <Loader2
                            size={12}
                            className={`animate-spin ${textMuted}`}
                          />
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                      {isBranchesLoading && branches.length === 0 ? (
                        <div className="px-3 py-6 text-center">
                          <Loader2
                            size={20}
                            className={`animate-spin mx-auto mb-2 ${textMuted}`}
                          />
                          <p className={`text-xs ${textMuted}`}>Loading...</p>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={handleSelectAllBranches}
                            disabled={isSwitchingBranch}
                            className={`
                              w-full px-3 py-2.5 flex items-center gap-3 transition-colors duration-100 disabled:opacity-50
                              ${isAllBranches ? dropdownItemActive : dropdownItemHover}
                            `}
                          >
                            <div
                              className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                isAllBranches
                                  ? isMarketplace
                                    ? "bg-white/20"
                                    : "bg-[#000060]/10"
                                  : isMarketplace
                                    ? "bg-white/10"
                                    : "bg-gray-100"
                              }`}
                            >
                              <Layers
                                size={14}
                                className={
                                  isAllBranches
                                    ? isMarketplace
                                      ? "text-white"
                                      : "text-[#000060]"
                                    : isMarketplace
                                      ? "text-white/50"
                                      : "text-gray-500"
                                }
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <span
                                className={`text-sm font-medium ${
                                  isAllBranches
                                    ? isMarketplace
                                      ? "text-white"
                                      : "text-[#000060]"
                                    : isMarketplace
                                      ? "text-white/70"
                                      : "text-gray-700"
                                }`}
                              >
                                All Branches
                              </span>
                              <p className={`text-[10px] mt-0.5 ${textMuted}`}>
                                View combined data (read-only)
                              </p>
                            </div>
                            {isAllBranches && (
                              <Check
                                size={14}
                                className={
                                  isMarketplace
                                    ? "text-white"
                                    : "text-[#000060]"
                                }
                              />
                            )}
                          </button>

                          {sortedBranches.length > 0 && (
                            <div
                              className={`my-1 mx-3 border-t ${
                                isMarketplace
                                  ? "border-white/10"
                                  : "border-gray-100"
                              }`}
                            />
                          )}

                          {sortedBranches.map((branch) => {
                            const isSelected =
                              selectedBranchId === branch.branch_id;
                            const isMain = branch.is_main;
                            return (
                              <button
                                key={branch.branch_id}
                                onClick={() => handleBranchChange(branch)}
                                disabled={isSwitchingBranch}
                                className={`
                                  w-full px-3 py-2.5 flex items-center gap-3 transition-colors duration-100 disabled:opacity-50
                                  ${isSelected ? dropdownItemActive : dropdownItemHover}
                                `}
                              >
                                <div
                                  className={`w-8 h-8 rounded-md flex items-center justify-center relative ${
                                    isMain || isSelected
                                      ? isMarketplace
                                        ? "bg-white/20"
                                        : "bg-[#000060]/10"
                                      : isMarketplace
                                        ? "bg-white/10"
                                        : "bg-gray-100"
                                  }`}
                                >
                                  <Building2
                                    size={14}
                                    className={
                                      isMain || isSelected
                                        ? isMarketplace
                                          ? "text-white"
                                          : "text-[#000060]"
                                        : isMarketplace
                                          ? "text-white/50"
                                          : "text-gray-500"
                                    }
                                  />
                                  {isMain && (
                                    <div
                                      className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
                                        isMarketplace
                                          ? "bg-blue-400"
                                          : "bg-[#000060]"
                                      }`}
                                    />
                                  )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-sm font-medium truncate ${
                                        isSelected
                                          ? isMarketplace
                                            ? "text-white"
                                            : "text-[#000060]"
                                          : isMarketplace
                                            ? "text-white/70"
                                            : "text-gray-700"
                                      }`}
                                    >
                                      {branch.branch_name}
                                    </span>
                                    {isMain && (
                                      <span
                                        className={`flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                          isMarketplace
                                            ? "text-blue-300 bg-blue-500/20"
                                            : "text-[#000060] bg-[#000060]/10"
                                        }`}
                                      >
                                        MAIN
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check
                                    size={14}
                                    className={`flex-shrink-0 ${
                                      isMarketplace
                                        ? "text-white"
                                        : "text-[#000060]"
                                    }`}
                                  />
                                )}
                              </button>
                            );
                          })}

                          {sortedBranches.length === 0 &&
                            !isBranchesLoading && (
                              <div className="px-3 py-4 text-center">
                                <p className={`text-xs ${textMuted}`}>
                                  No branches found
                                </p>
                              </div>
                            )}
                        </>
                      )}
                    </div>

                    <div className={`px-3 py-2 border-t ${dropdownFooterBg}`}>
                      <div
                        className={`flex items-center gap-1.5 text-[10px] ${textMuted}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAllBranches ? "bg-blue-400" : "bg-green-400"
                          }`}
                        />
                        <span>
                          Mode:{" "}
                          <span
                            className={`font-medium ${
                              isMarketplace ? "text-white/60" : "text-gray-600"
                            }`}
                          >
                            {isAllBranches
                              ? "Global (Read-only)"
                              : displayBranchName}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Branch display for non-switchers */}
            {!canSwitchBranches && (
              <div
                className={`hidden sm:flex items-center gap-2 h-10 px-3 rounded-lg border ${
                  isMarketplace
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <Building2
                  size={14}
                  className={isMarketplace ? "text-white/50" : "text-[#000060]"}
                />
                <span
                  className={`text-sm font-medium max-w-[120px] truncate ${
                    isMarketplace ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  {displayBranchName}
                </span>
              </div>
            )}

            <Divider />

            {/* Subscription renewal pill */}
            {isMarketplace ? (
              isSuperAdmin && needsRenewal ? (
                <>
                  <RenewalPill />
                  <Divider />
                </>
              ) : null
            ) : (
              <>
                <RenewalPill />
                {needsRenewal && isSuperAdmin && <Divider />}
              </>
            )}

            {/* Notifications */}
            <NotificationDropdown isMarketplace={isMarketplace} />

            <Divider />

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-2 sm:gap-3 p-1.5 rounded-xl transition-all ${
                  isMarketplace ? "hover:bg-white/10" : "hover:bg-gray-50"
                }`}
              >
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white/20 shadow-sm">
                  {userInitials}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white/20" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span
                    className={`text-sm font-semibold leading-tight ${textPrimary}`}
                  >
                    {userName}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${currentRole.color}`}
                  >
                    {currentRole.label}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`hidden md:block transition-transform ${
                    showProfileMenu ? "rotate-180" : ""
                  } ${textMuted}`}
                />
              </button>

              {showProfileMenu && (
                <div
                  className={`absolute right-0 top-full mt-2 w-72 rounded-xl border overflow-hidden z-50 ${dropdownBg}`}
                >
                  {/* Profile header */}
                  <div
                    className={`px-4 py-4 border-b ${
                      isMarketplace
                        ? "bg-white/5 border-white/10"
                        : "bg-gradient-to-br from-gray-50 to-white border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white font-bold text-lg">
                        {userInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${textPrimary}`}>
                          {userName}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded mt-1 ${currentRole.color}`}
                        >
                          <currentRole.icon size={10} />
                          {currentRole.label}
                        </span>
                        {userHandle && (
                          <p className={`text-xs truncate ${textSecondary}`}>
                            @{userHandle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shop / branch context */}
                  <div
                    className={`px-4 py-3 border-b ${
                      isMarketplace
                        ? "bg-white/[0.03] border-white/10"
                        : "bg-gray-50/50 border-gray-100"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 text-xs ${textSecondary}`}
                    >
                      <Store size={12} />
                      <span className="truncate">{displayShopName}</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 text-xs mt-1 ${textSecondary}`}
                    >
                      {isAllBranches ? (
                        <Layers size={12} />
                      ) : (
                        <Building2 size={12} />
                      )}
                      <span className="truncate">{displayBranchName}</span>
                      {isAllBranches && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            isMarketplace
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          READ-ONLY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    {hasPermission(PERMISSIONS.TICKETS_VIEW) && (
                      <button
                        onClick={() => {
                          navigate("/erp/tickets");
                          setShowProfileMenu(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          isMarketplace
                            ? "text-white/70 hover:bg-white/5"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Headphones
                          size={16}
                          className={
                            isMarketplace ? "text-white/40" : "text-gray-500"
                          }
                        />
                        <span>Contact & Support</span>
                      </button>
                    )}
                  </div>

                  {/* Logout */}
                  <div
                    className={`border-t p-2 ${
                      isMarketplace ? "border-white/10" : "border-gray-100"
                    }`}
                  >
                    <button
                      onClick={handleLogoutClick}
                      className={`w-full px-4 py-2.5 flex items-center justify-center gap-2 rounded-lg transition-colors ${
                        isMarketplace
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <LogOut size={16} />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message={
          <p>
            Are you sure you want to logout from your account?
            <br />
            <span className="text-gray-500 text-sm">
              You will need to login again to access your dashboard.
            </span>
          </p>
        }
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
        loading={isLoggingOut}
      />
    </>
  );
};

const TopHeader = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  if (!isAuthenticated || !user) return null;
  return <AuthenticatedTopHeader />;
};

export default TopHeader;
