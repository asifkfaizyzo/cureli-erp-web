// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/AudienceFilterPanel.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/InApp/comps/AudienceFilterPanel.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2,
  CreditCard,
  Calendar,
  UserCog,
  Shield,
  X,
  Search,
  ChevronDown,
  Check,
  Filter,
  Loader2,
} from "lucide-react";
import StyledDateFilter from "../../../../../../components/common/StyledDateFilter";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import { useDebounce } from "../../../../../../hooks/useDebounce";

function AudienceFilterPanel({
  filters,
  onChange,
  disabled,
  showUserFilters = true,
  showCAdminFilters = false,
  recipientPreview,
}) {
  // ── Remote data ───────────────────────────────────────────────────────────
  const [shops, setShops] = useState([]);
  const [plans, setPlans] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [cadminRoles, setCAdminRoles] = useState([]);

  // ── Loading states ────────────────────────────────────────────────────────
  const [loadingShops, setLoadingShops] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingCAdminRoles, setLoadingCAdminRoles] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // ── Dropdown visibility ───────────────────────────────────────────────────
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);

  // ── Search ────────────────────────────────────────────────────────────────
  const [shopSearch, setShopSearch] = useState("");
  const debouncedShopSearch = useDebounce(shopSearch, 300);

  // ── Selected local state ──────────────────────────────────────────────────
  const [selectedShops, setSelectedShops] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedCAdminRoles, setSelectedCAdminRoles] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ── Stable refs ───────────────────────────────────────────────────────────
  // Keep latest onChange + filters in refs so callbacks are stable
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Track whether we've done the initial sync from props
  const didSyncRef = useRef(false);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    loadPlans();
    loadUserRoles();
    loadCAdminRoles();
  }, []);

  // ── Load shops on search ──────────────────────────────────────────────────
  useEffect(() => {
    if (showUserFilters) {
      loadShops(debouncedShopSearch);
    }
  }, [debouncedShopSearch, showUserFilters]);

  // ── Sync local state from filters prop (draft editing) ───────────────────
  // Only run once on mount / when filters first arrive with content
  useEffect(() => {
    if (didSyncRef.current) return;
    if (!filters || Object.keys(filters).length === 0) return;

    didSyncRef.current = true;

    if (Array.isArray(filters.roles)) setSelectedRoles(filters.roles);
    if (Array.isArray(filters.cadmin_roles))
      setSelectedCAdminRoles(filters.cadmin_roles);
    if (Array.isArray(filters.plan_ids)) setSelectedPlans(filters.plan_ids);
    if (filters.registration_date_from)
      setDateFrom(filters.registration_date_from);
    if (filters.registration_date_to) setDateTo(filters.registration_date_to);

    // For shops: we only have IDs — fetch names to reconstruct objects
    if (Array.isArray(filters.shop_ids) && filters.shop_ids.length > 0) {
      broadcastAPI
        .getShopsForFilter("", 1, 200)
        .then((res) => {
          if (res.data.success) {
            const allShops = res.data.data.shops || [];
            const matched = allShops.filter((s) =>
              filters.shop_ids.includes(s.shop_id),
            );
            setSelectedShops(matched);
          }
        })
        .catch(console.error);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ intentionally only sync once; subsequent changes come from user interaction

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadShops = async (search = "") => {
    setLoadingShops(true);
    try {
      const res = await broadcastAPI.getShopsForFilter(search, 1, 50);
      if (res.data.success) {
        setShops(res.data.data.shops || []);
      }
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoadingShops(false);
    }
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await broadcastAPI.getActivePlans();
      if (res.data.success) {
        // API returns { data: { plans: [...] } } or { data: [...] }
        const raw = res.data.data;
        setPlans(Array.isArray(raw) ? raw : raw.plans || raw.data || []);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadUserRoles = async () => {
    setLoadingRoles(true);
    try {
      // Returns: [{ value, label, count }] — dynamic from DB
      const res = await broadcastAPI.getUserRoles();
      if (res.data.success) {
        setUserRoles(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load user roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadCAdminRoles = async () => {
    setLoadingCAdminRoles(true);
    try {
      // Returns: [{ value, label, description }]
      const res = await broadcastAPI.getCAdminRoles();
      if (res.data.success) {
        setCAdminRoles(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load CAdmin roles:", err);
    } finally {
      setLoadingCAdminRoles(false);
    }
  };

  // ── Stable updateFilters using refs ───────────────────────────────────────
  const updateFilters = useCallback((updates) => {
    const current = filtersRef.current || {};
    const newFilters = { ...current, ...updates };

    // Remove empty/null/undefined values to keep filters clean
    Object.keys(newFilters).forEach((key) => {
      const val = newFilters[key];
      if (
        val === "" ||
        val === null ||
        val === undefined ||
        (Array.isArray(val) && val.length === 0)
      ) {
        delete newFilters[key];
      }
    });

    onChangeRef.current(newFilters);
  }, []); //  Truly stable

  // ── Filter change handlers ────────────────────────────────────────────────
  const handleShopToggle = useCallback(
    (shop) => {
      setSelectedShops((prev) => {
        const exists = prev.some((s) => s.shop_id === shop.shop_id);
        const next = exists
          ? prev.filter((s) => s.shop_id !== shop.shop_id)
          : [...prev, shop];
        updateFilters({ shop_ids: next.map((s) => s.shop_id) });
        return next;
      });
    },
    [updateFilters],
  );

  const handlePlanToggle = useCallback(
    (plan) => {
      setSelectedPlans((prev) => {
        const exists = prev.includes(plan.plan_id);
        const next = exists
          ? prev.filter((id) => id !== plan.plan_id)
          : [...prev, plan.plan_id];
        updateFilters({ plan_ids: next });
        return next;
      });
    },
    [updateFilters],
  );

  const handleRoleToggle = useCallback(
    (roleValue) => {
      setSelectedRoles((prev) => {
        const exists = prev.includes(roleValue);
        const next = exists
          ? prev.filter((r) => r !== roleValue)
          : [...prev, roleValue];
        updateFilters({ roles: next });
        return next;
      });
    },
    [updateFilters],
  );

  const handleCAdminRoleToggle = useCallback(
    (roleValue) => {
      setSelectedCAdminRoles((prev) => {
        const exists = prev.includes(roleValue);
        const next = exists
          ? prev.filter((r) => r !== roleValue)
          : [...prev, roleValue];
        updateFilters({ cadmin_roles: next });
        return next;
      });
    },
    [updateFilters],
  );

  const handleDateFromChange = useCallback(
    (value) => {
      setDateFrom(value);
      updateFilters({ registration_date_from: value || undefined });
    },
    [updateFilters],
  );

  const handleDateToChange = useCallback(
    (value) => {
      setDateTo(value);
      updateFilters({ registration_date_to: value || undefined });
    },
    [updateFilters],
  );

  const clearAllFilters = useCallback(() => {
    setSelectedShops([]);
    setSelectedPlans([]);
    setSelectedRoles([]);
    setSelectedCAdminRoles([]);
    setDateFrom("");
    setDateTo("");
    //  Only clear filter keys — audience toggles (includeUsers/includeCAdmins)
    // are managed by the parent, not here
    onChangeRef.current({});
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const hasActiveFilters =
    selectedShops.length > 0 ||
    selectedPlans.length > 0 ||
    selectedRoles.length > 0 ||
    selectedCAdminRoles.length > 0 ||
    !!dateFrom ||
    !!dateTo;

  // ── Helpers for recipientPreview by_shop display ──────────────────────────
  const getShopName = (shopId, shopData) => {
    if (shopData?.name) return shopData.name;
    const found = selectedShops.find(
      (s) => s.shop_id === shopId || s.shop_id === parseInt(shopId),
    );
    if (found) return found.business_name || found.name;
    const loaded = shops.find(
      (s) => s.shop_id === shopId || s.shop_id === parseInt(shopId),
    );
    if (loaded) return loaded.business_name;
    return `Shop #${String(shopId).slice(0, 8)}`;
  };

  const getShopCount = (shopData) => {
    if (typeof shopData === "number") return shopData;
    return shopData?.count ?? 0;
  };

  // ── Nothing to show ───────────────────────────────────────────────────────
  if (!showUserFilters && !showCAdminFilters) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        <Filter size={20} className="mx-auto mb-2 opacity-50" />
        Select an audience type above to configure filters
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Filter Options
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* ── USER FILTERS ──────────────────────────────────────────────── */}
      {showUserFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Shops */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
              <Building2 size={12} />
              Shops
            </label>
            <button
              type="button"
              onClick={() => setShowShopDropdown((v) => !v)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                className={
                  selectedShops.length ? "text-gray-900" : "text-gray-400"
                }
              >
                {selectedShops.length
                  ? `${selectedShops.length} selected`
                  : "All shops"}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${showShopDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showShopDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowShopDropdown(false)}
                />
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={shopSearch}
                        onChange={(e) => setShopSearch(e.target.value)}
                        placeholder="Search shops..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1">
                    {loadingShops ? (
                      <div className="p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />{" "}
                        Loading...
                      </div>
                    ) : shops.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">
                        No shops found
                      </div>
                    ) : (
                      shops.map((shop) => {
                        const isSelected = selectedShops.some(
                          (s) => s.shop_id === shop.shop_id,
                        );
                        return (
                          <button
                            key={shop.shop_id}
                            onClick={() => handleShopToggle(shop)}
                            className={`w-full px-3 py-2 text-left text-xs rounded flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              isSelected ? "bg-[#05015A]/5" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900 block truncate">
                                {shop.business_name}
                              </span>
                              {shop.city && (
                                <span className="text-gray-400">
                                  {shop.city}
                                </span>
                              )}
                              <span className="text-gray-400 ml-1">
                                · {shop.user_count || 0} users
                              </span>
                            </div>
                            {isSelected && (
                              <Check
                                size={14}
                                className="text-[#05015A] flex-shrink-0 ml-2"
                              />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={() => setShowShopDropdown(false)}
                      className="w-full py-1.5 text-xs font-medium text-[#05015A] hover:bg-[#05015A]/5 rounded transition-colors"
                    >
                      Done ({selectedShops.length} selected)
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Selected shop tags */}
            {selectedShops.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedShops.slice(0, 3).map((shop) => (
                  <span
                    key={shop.shop_id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#05015A]/10 text-[#05015A] rounded text-[10px]"
                  >
                    {shop.business_name}
                    <button
                      onClick={() => handleShopToggle(shop)}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {selectedShops.length > 3 && (
                  <span className="text-[10px] text-gray-400 py-0.5">
                    +{selectedShops.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Plans */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
              <CreditCard size={12} />
              Plans
            </label>
            <button
              type="button"
              onClick={() => setShowPlanDropdown((v) => !v)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                className={
                  selectedPlans.length ? "text-gray-900" : "text-gray-400"
                }
              >
                {selectedPlans.length
                  ? `${selectedPlans.length} selected`
                  : "All plans"}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${showPlanDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showPlanDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPlanDropdown(false)}
                />
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="max-h-48 overflow-y-auto p-1">
                    {loadingPlans ? (
                      <div className="p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />{" "}
                        Loading...
                      </div>
                    ) : plans.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">
                        No plans available
                      </div>
                    ) : (
                      plans.map((plan) => {
                        const isSelected = selectedPlans.includes(plan.plan_id);
                        return (
                          <button
                            key={plan.plan_id}
                            onClick={() => handlePlanToggle(plan)}
                            className={`w-full px-3 py-2 text-left text-xs rounded flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              isSelected ? "bg-[#05015A]/5" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900">
                                {plan.name}
                              </span>
                              {plan.price !== undefined && (
                                <span className="text-gray-400 ml-1">
                                  · ₹{plan.price}
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <Check
                                size={14}
                                className="text-[#05015A] flex-shrink-0"
                              />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={() => setShowPlanDropdown(false)}
                      className="w-full py-1.5 text-xs font-medium text-[#05015A] hover:bg-[#05015A]/5 rounded transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Selected plan tags */}
            {selectedPlans.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedPlans.map((planId) => {
                  const plan = plans.find((p) => p.plan_id === planId);
                  return (
                    <span
                      key={planId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#05015A]/10 text-[#05015A] rounded text-[10px]"
                    >
                      {plan?.name || planId.slice(0, 8)}
                      <button
                        onClick={() => plan && handlePlanToggle(plan)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Roles — dynamic from backend */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
              <UserCog size={12} />
              User Roles
            </label>
            {loadingRoles ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" /> Loading roles...
              </div>
            ) : userRoles.length === 0 ? (
              <span className="text-xs text-gray-400">No roles found</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {userRoles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleToggle(role.value)}
                    disabled={disabled}
                    title={`${role.count} users`}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all duration-150 disabled:opacity-50 ${
                      selectedRoles.includes(role.value)
                        ? "bg-[#05015A] border-[#05015A] text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {role.label}
                    {role.count !== undefined && (
                      <span
                        className={`ml-1 text-[9px] ${
                          selectedRoles.includes(role.value)
                            ? "text-white/70"
                            : "text-gray-400"
                        }`}
                      >
                        ({role.count})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Registration Date */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
              <Calendar size={12} />
              Registration Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <StyledDateFilter
                date={dateFrom}
                setDate={handleDateFromChange}
                placeholder="From"
              />
              <StyledDateFilter
                date={dateTo}
                setDate={handleDateToChange}
                placeholder="To"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── CADMIN FILTERS ────────────────────────────────────────────── */}
      {showCAdminFilters && (
        <div className={showUserFilters ? "pt-4 border-t border-gray-100" : ""}>
          <label className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5 block">
            <Shield size={12} />
            Admin Roles
          </label>
          {loadingCAdminRoles ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" /> Loading roles...
            </div>
          ) : cadminRoles.length === 0 ? (
            <span className="text-xs text-gray-400">No admin roles found</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {cadminRoles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleCAdminRoleToggle(role.value)}
                  disabled={disabled}
                  title={role.description || role.label}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all duration-150 disabled:opacity-50 ${
                    selectedCAdminRoles.includes(role.value)
                      ? "bg-[#05015A] border-[#05015A] text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Recipients by Shop breakdown ──────────────────────────────── */}
      {recipientPreview &&
        Object.keys(recipientPreview.by_shop || {}).length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Building2 size={12} />
                Recipients by Shop
              </span>
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {Object.keys(recipientPreview.by_shop).length} shops
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(recipientPreview.by_shop)
                .slice(0, 6)
                .map(([shopId, shopData]) => (
                  <div
                    key={shopId}
                    className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg"
                  >
                    <span
                      className="text-xs text-gray-700 truncate max-w-[120px]"
                      title={getShopName(shopId, shopData)}
                    >
                      {getShopName(shopId, shopData)}
                    </span>
                    <span className="font-semibold text-xs text-[#05015A] bg-[#05015A]/10 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                      {getShopCount(shopData)}
                    </span>
                  </div>
                ))}
            </div>
            {Object.keys(recipientPreview.by_shop).length > 6 && (
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400">
                  +{Object.keys(recipientPreview.by_shop).length - 6} more shops
                </span>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export default AudienceFilterPanel;
