// cadmin-web/src/components/layout/AdminHeader.jsx (do not remove this comment)
// src/components/layout/AdminHeader.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Settings,
  LogOut,
  Clock,
  Calendar,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import logo from "../../assets/icons/curelinew.svg";
import { useAuth } from "../../context/AuthContext";
import { NotificationDropdown } from "../common/notifications";
import { useAdminMode } from "../../store/useAdminModeStore";
import { useMenuStore } from "../../store/useMenuStore";

const AdminHeader = () => {
  const navigate = useNavigate();
  const { admin, loading, logout, refreshProfile } = useAuth();
  const { activeModule, setActiveModule, isAdmin, isMarketplace, isFleet } =
    useAdminMode();
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  // ============================================F
  // STATE
  // ============================================
  const [dateTime, setDateTime] = useState({ time: "", date: "", day: "" });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const profileRef = useRef(null);

  // ============================================
  // MODULE SWITCH HANDLERS
  // ============================================
  const handleSwitchToAdmin = () => {
    if (isAdmin) return;
    setActiveModule("admin");
    setActiveMenu("dashboard");
    setBreadcrumbs(["Dashboard"]);
    setTimeout(() => navigate("/dashboard"), 50);
  };

  const handleSwitchToMarketplace = () => {
    if (isMarketplace) return;
    setActiveModule("marketplace");
    setActiveMenu("mp-users");
    setBreadcrumbs(["Marketplace", "Users"]);
    setTimeout(() => navigate("/marketplace/dashboard"), 50);
  };
  const handleSwitchToFleet = () => {
    if (isFleet) return;
    setActiveModule("fleet");
    setActiveMenu("fleet-riders");
    setBreadcrumbs(["Fleet", "Riders"]);
    setTimeout(() => navigate("/fleet/riders"), 50);
  };

  // ============================================
  // CLOCK
  // ============================================
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
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ============================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setShowProfileMenu(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setTimeout(() => setRefreshing(false), 500);
  };

  // ============================================
  // HELPERS
  // ============================================
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = () => {
    if (admin?.is_super_cadmin) return "bg-purple-100 text-purple-700";
    return "bg-indigo-100 text-indigo-700";
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* ── LEFT — Logo & Date/Time ── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Cureli" className="h-9 w-auto" />
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-bold text-[#000060] leading-tight">
                Cureli
              </span>
              <span className="text-[10px] text-gray-400 font-medium -mt-0.5">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-gray-200 ml-2" />

          {/* Date & Time */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={14} />
              <span className="text-sm font-medium">{dateTime.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock size={14} />
              <span className="text-sm font-medium tabular-nums">
                {dateTime.time}
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Actions & Profile ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ── MODULE SWITCHER ── */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={handleSwitchToAdmin}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md
                text-xs font-semibold transition-all duration-150
                ${
                  isAdmin
                    ? "bg-white text-[#05015A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <ShieldCheck size={13} />
              <span className="hidden sm:block">Pharmacy</span>
            </button>
            <button
              onClick={handleSwitchToMarketplace}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md
                text-xs font-semibold transition-all duration-150
                ${
                  isMarketplace
                    ? "bg-white text-[#05015A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <Store size={13} />
              <span className="hidden sm:block">Marketplace</span>
            </button>
            <button
              onClick={handleSwitchToFleet}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md
                text-xs font-semibold transition-all duration-150
                ${
                  isFleet
                    ? "bg-white text-[#05015A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <Truck size={13} />
              <span className="hidden sm:block">Fleet</span>
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
            >
              {/* Avatar */}
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white font-semibold text-sm">
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  getInitials(admin?.name)
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
              </div>

              {/* Name & Role badge */}
              <div className="hidden sm:flex flex-col items-start">
                {loading ? (
                  <>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mt-1" />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-gray-800 leading-tight">
                      {admin?.name || "Admin"}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getRoleBadgeColor()}`}
                    >
                      {admin?.primary_role ?? "Admin"}
                    </span>
                  </>
                )}
              </div>

              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* ── Profile Dropdown ── */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                {/* Info block */}
                <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(admin?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {admin?.name || "Admin"}
                      </p>
                      {admin?.username && (
                        <p className="text-xs text-gray-500 truncate">
                          @{admin.username}
                        </p>
                      )}
                      {admin?.primary_role && (
                        <span
                          className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 ${getRoleBadgeColor()}`}
                        >
                          {admin.primary_role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current module indicator */}
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {isMarketplace ? (
                      <Store size={12} />
                    ) : (
                      <ShieldCheck size={12} />
                    )}
                    <span>
                      Module:{" "}
                      <span className="font-medium text-gray-700">
                        {isMarketplace ? "Marketplace" : "Admin"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/settings");
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    <span className="text-sm">Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 p-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-center gap-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
  );
};

export default AdminHeader;
