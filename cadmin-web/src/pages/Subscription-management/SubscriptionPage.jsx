// cadmin-web/src/pages/Subscription-management/SubscriptionPage.jsx (do not remove this comment)
import {
  Plus,
  BadgeIndianRupee,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Package,
  CheckCircle,
  Clock,
  Ban,
  Sparkles,
  Archive,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "../../components/common/Toast";
import { useMenuStore } from "../../store/useMenuStore";
import Pagination from "../../components/common/Pagination";
import { useCAdminPermission } from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../config/cadminPermissions";

import PlanCard from "./comps/plans/PlanCard";
import PlanModal from "./comps/plans/PlanModal";
import CreatePlanModal from "./comps/plans/CreatePlanModal";
import ConfirmActionModal from "./comps/plans/ConfirmActionModal";

import {
  generateCloneName,
  PLAN_STATUS,
} from "../../config/modules/subscriptionConfig";

import {
  normalizePlans,
  countPlansNeedingReview,
} from "../../utils/normalizePlan";

import {
  getPlans,
  getPlanStats,
  createPlan,
  updatePlan,
  activatePlan,
  suspendPlan,
  reactivatePlan,
  clonePlan,
  deletePlan,
} from "../../api/cadminPlans";

const PLANS_PER_PAGE = 8;

const STATUS_FILTERS = [
  { key: "all",                  label: "All",        icon: Package },
  { key: PLAN_STATUS.ACTIVE,     label: "Active",     icon: CheckCircle },
  { key: PLAN_STATUS.DRAFT,      label: "Draft",      icon: Clock },
  { key: PLAN_STATUS.DEPRECATED, label: "Deprecated", icon: Archive },
  { key: PLAN_STATUS.SUSPENDED,  label: "Suspended",  icon: Ban },
  { key: "trash",                label: "Trash",      icon: Trash2 },
];

export default function SubscriptionPage() {
  const toast = useToast();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);
  const { hasPermission } = useCAdminPermission();

  const canEdit   = hasPermission(CADMIN_PERMISSIONS.PLANS_EDIT);
  const canCreate = hasPermission(CADMIN_PERMISSIONS.PLANS_CREATE);
  const canDelete = hasPermission(CADMIN_PERMISSIONS.PLANS_DELETE);

  // ============================================
  // STATE
  // ============================================
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    active: 0,
    deprecated: 0,
    suspended: 0,
    with_active_promo: 0,
    trashed: 0,
  });
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [planTypeFilter, setPlanTypeFilter] = useState("PRE_MADE");
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [currentPage, setCurrentPage]       = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen]     = useState(false);
  const [planModalMode, setPlanModalMode]     = useState("view");
  const [selectedPlan, setSelectedPlan]       = useState(null);
  const [confirmModal, setConfirmModal]       = useState({
    open: false,
    action: null,
    plan: null,
    newName: null,
  });

  useEffect(() => {
    setBreadcrumbs(["Subscriptions", "Plans"]);
  }, [setBreadcrumbs]);

  // ============================================
  // DATA FETCHING
  // ============================================
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const isTrashView = statusFilter === "trash";

      const [plansResponse, statsResponse] = await Promise.all([
        getPlans({
          limit: 100,
          sort_by: "created_at",
          sort_order: "desc",
          type: planTypeFilter,
          include_deleted: isTrashView,
        }),
        getPlanStats(),
      ]);

      if (plansResponse.success) {
        const rawPlans = plansResponse.data.plans || [];
        const normalizedPlans = normalizePlans(rawPlans, {
          flagForReview: true,
        });

        setPlans(normalizedPlans);

        if (!isTrashView) {
          const reviewCount = countPlansNeedingReview(normalizedPlans);
          if (reviewCount > 0) {
            toast.warning(
              "Expired Promos Detected",
              `${reviewCount} plan(s) have expired promos that need attention.`,
            );
          }
        }
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      const errorMsg = err.response?.data?.message || "Failed to load plans";
      setError(errorMsg);
      toast.error("Load Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [planTypeFilter, statusFilter, toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    setStatusFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  }, [planTypeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest plans...");
    fetchPlans();
  }, [toast, fetchPlans]);

  // ============================================
  // DERIVED DATA
  // ============================================
  const plansNeedingReview = useMemo(() => {
    return countPlansNeedingReview(plans);
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
      if (!matchesSearch) return false;

      if (statusFilter === "trash") {
        return p.deleted_at !== null && p.deleted_at !== undefined;
      }

      if (p.deleted_at !== null && p.deleted_at !== undefined) return false;

      if (statusFilter === "all") return true;
      return p.status === statusFilter;
    });
  }, [plans, searchQuery, statusFilter]);

  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * PLANS_PER_PAGE;
    return filteredPlans.slice(startIndex, startIndex + PLANS_PER_PAGE);
  }, [filteredPlans, currentPage]);

  const planCounts = useMemo(
    () => ({
      all: plans.filter(
        (p) => p.deleted_at === null || p.deleted_at === undefined,
      ).length,
      [PLAN_STATUS.ACTIVE]:
        stats.active ||
        plans.filter(
          (p) =>
            p.status === PLAN_STATUS.ACTIVE &&
            (p.deleted_at === null || p.deleted_at === undefined),
        ).length,
      [PLAN_STATUS.DRAFT]:
        stats.draft ||
        plans.filter(
          (p) =>
            p.status === PLAN_STATUS.DRAFT &&
            (p.deleted_at === null || p.deleted_at === undefined),
        ).length,
      [PLAN_STATUS.DEPRECATED]:
        stats.deprecated ||
        plans.filter(
          (p) =>
            p.status === PLAN_STATUS.DEPRECATED &&
            (p.deleted_at === null || p.deleted_at === undefined),
        ).length,
      [PLAN_STATUS.SUSPENDED]:
        stats.suspended ||
        plans.filter(
          (p) =>
            p.status === PLAN_STATUS.SUSPENDED &&
            (p.deleted_at === null || p.deleted_at === undefined),
        ).length,
    }),
    [plans, stats],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== "all";

  // ============================================
  // PLAN ACTIONS
  // ============================================
  const handlePlanAction = (actionType, plan) => {
    if ((actionType === "edit" || actionType === "clone") && !canEdit) {
      toast.warning(
        "Permission Denied",
        "You don't have permission to edit plans",
      );
      return;
    }

    if ((actionType === "delete" || actionType === "trash") && !canDelete) {
      toast.warning(
        "Permission Denied",
        "You don't have permission to delete plans",
      );
      return;
    }

    switch (actionType) {
      case "edit":
        setSelectedPlan(plan);
        setPlanModalMode("edit");
        setPlanModalOpen(true);
        break;

      case "view":
        setSelectedPlan(plan);
        setPlanModalMode("view");
        setPlanModalOpen(true);
        break;

      case "activate":
      case "suspend":
      case "reactivate":
      case "delete":
      case "trash":
        setConfirmModal({
          open: true,
          action: actionType,
          plan: plan,
          newName: null,
        });
        break;

      case "clone": {
        const cloneName = generateCloneName(plan.name, plans);
        setConfirmModal({
          open: true,
          action: "clone",
          plan: plan,
          newName: cloneName,
        });
        break;
      }

      default:
        break;
    }
  };

  const handleConfirmAction = async () => {
    const { action, plan, newName } = confirmModal;
    setActionLoading(true);

    try {
      let response;

      switch (action) {
        case "activate":
          response = await activatePlan(plan.plan_id);
          break;
        case "suspend":
          response = await suspendPlan(plan.plan_id);
          break;
        case "reactivate":
          response = await reactivatePlan(plan.plan_id);
          break;
        case "clone":
          response = await clonePlan(plan.plan_id, newName);
          break;
        case "delete":
        case "trash":
          response = await deletePlan(plan.plan_id);
          break;
        default:
          break;
      }

      if (response?.success) {
        await fetchPlans();

        const actionMessages = {
          activate:   `Plan "${plan.name}" activated successfully.`,
          suspend:    `Plan "${plan.name}" suspended successfully.`,
          reactivate: `Plan "${plan.name}" reactivated successfully.`,
          clone:      `Plan "${newName}" created successfully.`,
          delete:     `Plan "${plan.name}" deleted successfully.`,
          trash:      `Plan "${plan.name}" moved to trash.`,
        };

        toast.success(
          action.charAt(0).toUpperCase() + action.slice(1) + " Successful",
          actionMessages[action],
        );

        if (action === "clone" && planTypeFilter === "CUSTOM") {
          setPlanTypeFilter("PRE_MADE");
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} plan:`, err);
      const errorMsg =
        err.response?.data?.message || `Failed to ${action} plan`;
      toast.error(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
        errorMsg,
      );
    } finally {
      setActionLoading(false);
      setConfirmModal({ open: false, action: null, plan: null, newName: null });
    }
  };

  const handleCreatePlan = async (formData) => {
    setActionLoading(true);
    try {
      const apiData = {
        name:                 formData.name,
        description:          formData.description,
        price:                Number(formData.price),
        max_users:            formData.max_users,
        max_branches:         formData.max_branches,
        billing_cycle_months: formData.billing_cycle_months || 12,
        is_featured:          formData.is_featured,
        type:                 "PRE_MADE",
      };

      if (formData.compare_at_price !== undefined && formData.compare_at_price !== null && formData.compare_at_price !== "") {
        apiData.compare_at_price = Number(formData.compare_at_price);
      }

      if (formData.bonus_months !== undefined && formData.bonus_months !== null && formData.bonus_months !== "") {
        apiData.bonus_months = Number(formData.bonus_months);
      }

      if (formData.promo_free_until) {
        apiData.promo_free_until = formData.promo_free_until;
      }

      if (
        formData.intro_price !== undefined &&
        formData.intro_price !== null &&
        formData.intro_price !== "" &&
        formData.intro_trigger_type
      ) {
        apiData.intro_price        = Number(formData.intro_price);
        apiData.intro_trigger_type = formData.intro_trigger_type;

        if (
          formData.intro_trigger_type === "duration" &&
          formData.intro_duration_years
        ) {
          apiData.intro_duration_years = Number(formData.intro_duration_years);
        }
        if (
          formData.intro_trigger_type === "date" &&
          formData.intro_end_date
        ) {
          apiData.intro_end_date = formData.intro_end_date;
        }
      }

      const response = await createPlan(apiData);

      if (response?.success) {
        if (planTypeFilter === "CUSTOM") {
          setPlanTypeFilter("PRE_MADE");
        }
        await fetchPlans();
        setCreateModalOpen(false);
        setCurrentPage(1);
        toast.success(
          "Plan Created",
          `${formData.name} has been created successfully.`,
        );
      }
    } catch (err) {
      console.error("Failed to create plan:", err);
      const errorMsg = err.response?.data?.message || "Failed to create plan";
      toast.error("Creation Failed", errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePlan = async (updatedPlan) => {
    setActionLoading(true);

    try {
      const updateData = {
        name:                 updatedPlan.name,
        description:          updatedPlan.description,
        price:                Number(updatedPlan.price),
        max_users:            updatedPlan.max_users,
        max_branches:         updatedPlan.max_branches,
        billing_cycle_months: updatedPlan.billing_cycle_months || 12,
        is_featured:          updatedPlan.is_featured,
        compare_at_price:     updatedPlan.compare_at_price
          ? Number(updatedPlan.compare_at_price)
          : null,
        bonus_months:         updatedPlan.bonus_months !== undefined &&
                              updatedPlan.bonus_months !== null &&
                              updatedPlan.bonus_months !== ""
          ? Number(updatedPlan.bonus_months)
          : 0,
        promo_free_until:     updatedPlan.promo_free_until || null,
        intro_price:
          updatedPlan.intro_price !== null &&
          updatedPlan.intro_price !== undefined &&
          updatedPlan.intro_price !== ""
            ? Number(updatedPlan.intro_price)
            : null,
        intro_trigger_type:   updatedPlan.intro_trigger_type   || null,
        intro_duration_years: updatedPlan.intro_duration_years
          ? Number(updatedPlan.intro_duration_years)
          : null,
        intro_end_date:       updatedPlan.intro_end_date || null,
      };

      const response = await updatePlan(updatedPlan.plan_id, updateData);

      if (response?.success) {
        await fetchPlans();
        setPlanModalOpen(false);
        setSelectedPlan(null);
        toast.success(
          "Plan Updated",
          `${updatedPlan.name} has been updated successfully.`,
        );
      }
    } catch (err) {
      console.error("Failed to update plan:", err);
      const errorMsg = err.response?.data?.message || "Failed to update plan";
      toast.error("Update Failed", errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="text-[#000060] animate-spin" />
          <p className="text-gray-500 text-sm">Loading plans...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && plans.length === 0) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Failed to Load Plans
          </h3>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg text-sm font-medium hover:bg-[#000080] transition-all"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Error Banner */}
      {error && plans.length > 0 && (
        <div className="flex-shrink-0 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Expired Promo Warning Banner */}
      {plansNeedingReview > 0 && statusFilter !== "trash" && (
        <div className="flex-shrink-0 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <span className="text-sm font-medium">
              {plansNeedingReview} plan{plansNeedingReview !== 1 ? "s" : ""}{" "}
              with expired promos need attention
            </span>
            <span className="text-xs text-amber-600">
              (Look for plans with warning indicators)
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <BadgeIndianRupee size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Subscription Plans
              </h1>
              <p className="text-sm text-gray-500">
                {stats.total} total plan{stats.total !== 1 ? "s" : ""} •{" "}
                {stats.active} active
                {plansNeedingReview > 0 && statusFilter !== "trash" && (
                  <span className="text-amber-600 ml-2">
                    • {plansNeedingReview} need review
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {canCreate && planTypeFilter === "PRE_MADE" && statusFilter !== "trash" && (
              <button
                onClick={() => setCreateModalOpen(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#000060] text-white rounded-lg
                           hover:shadow-lg hover:shadow-[#000060]/25 transition-all flex items-center gap-2
                           disabled:opacity-50"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Create Plan</span>
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                         disabled:opacity-50 flex-shrink-0"
              title="Refresh plans"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Plan Type Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => setPlanTypeFilter("PRE_MADE")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  planTypeFilter === "PRE_MADE"
                    ? "bg-white text-[#000060] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pre-made Plans
              </button>
              <button
                onClick={() => setPlanTypeFilter("CUSTOM")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  planTypeFilter === "CUSTOM"
                    ? "bg-white text-violet-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Custom Plans
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm
                           bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20
                           focus:border-[#000060] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                             text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filters */}
          {planTypeFilter === "PRE_MADE" && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                {STATUS_FILTERS.map((filterOption) => {
                  const Icon     = filterOption.icon;
                  const count    = planCounts[filterOption.key] || 0;
                  const isActive = statusFilter === filterOption.key;

                  if (
                    (filterOption.key === PLAN_STATUS.DEPRECATED ||
                      filterOption.key === PLAN_STATUS.SUSPENDED) &&
                    count === 0
                  ) {
                    return null;
                  }

                  if (filterOption.key === "trash" && !stats.trashed) {
                    return null;
                  }

                  return (
                    <button
                      key={filterOption.key}
                      onClick={() => setStatusFilter(filterOption.key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${
                          isActive
                            ? filterOption.key === "trash"
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-[#000060] text-white shadow-sm"
                            : filterOption.key === "trash"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      <Icon size={14} />
                      {filterOption.label}
                      {filterOption.key === "trash" ? (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {stats.trashed || 0}
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}

                {stats.with_active_promo > 0 && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                               bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700
                               border border-amber-200 hover:border-amber-300 transition-all"
                  >
                    <Sparkles size={14} />
                    With Promo
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100">
                      {stats.with_active_promo}
                    </span>
                  </button>
                )}

                {plansNeedingReview > 0 && statusFilter !== "trash" && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                               bg-red-50 text-red-700 border border-red-200 hover:border-red-300 transition-all"
                  >
                    <AlertTriangle size={14} />
                    Needs Review
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-100">
                      {plansNeedingReview}
                    </span>
                  </button>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 hover:text-red-700
                               hover:bg-red-50 rounded-lg transition-all ml-auto"
                  >
                    <X size={16} />
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {planTypeFilter === "CUSTOM" && (
            <div className="text-sm text-gray-500 italic">
              Custom plans are created specifically for individual shops when
              assigning subscriptions.
            </div>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="flex-1 min-h-0 pt-1 overflow-auto">
        {paginatedPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {paginatedPlans.map((plan) => (
              <PlanCard
                key={plan.plan_id}
                plan={plan}
                onAction={handlePlanAction}
                needsReview={plan._needs_review}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="p-5 bg-gray-100 rounded-full mb-4">
              {statusFilter === "trash" ? (
                <Trash2 size={40} className="text-gray-400" />
              ) : (
                <BadgeIndianRupee size={40} className="text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {statusFilter === "trash"
                ? "Trash is Empty"
                : planTypeFilter === "CUSTOM"
                ? "No Custom Plans"
                : "No Plans Found"}
            </h3>
            <p className="text-gray-500 mb-5 text-center max-w-md text-sm">
              {statusFilter === "trash"
                ? "No deleted plans found."
                : planTypeFilter === "CUSTOM"
                ? "Custom plans are created when assigning subscriptions to individual shops."
                : hasActiveFilters
                ? "No plans match your current filters. Try adjusting your search or filter criteria."
                : "Get started by creating your first subscription plan."}
            </p>
            {statusFilter === "trash" ? (
              <button
                onClick={() => setStatusFilter("all")}
                className="px-5 py-2.5 bg-[#000060] text-white rounded-xl text-sm font-semibold hover:bg-[#000080] transition-all"
              >
                Back to All Plans
              </button>
            ) : planTypeFilter === "PRE_MADE" && hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-[#000060] text-white rounded-xl text-sm font-semibold hover:bg-[#000080] transition-all"
              >
                Clear Filters
              </button>
            ) : canCreate && planTypeFilter === "PRE_MADE" ? (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-5 py-2.5 bg-[#000060] text-white rounded-xl text-sm font-semibold hover:bg-[#000080] transition-all"
              >
                Create First Plan
              </button>
            ) : (
              <button
                onClick={() => setPlanTypeFilter("PRE_MADE")}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-all"
              >
                View Pre-made Plans
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredPlans.length > PLANS_PER_PAGE && (
        <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200">
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={filteredPlans.length}
            rowsPerPage={PLANS_PER_PAGE}
          />
        </div>
      )}

      {/* Modals */}
      {canCreate && (
        <CreatePlanModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreatePlan}
          loading={actionLoading}
        />
      )}

      <PlanModal
        isOpen={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onSave={handleSavePlan}
        allPlans={plans}
        mode={planModalMode}
        loading={actionLoading}
        canEdit={canEdit}
      />

      <ConfirmActionModal
        isOpen={confirmModal.open}
        onClose={() =>
          setConfirmModal({
            open: false,
            action: null,
            plan: null,
            newName: null,
          })
        }
        onConfirm={handleConfirmAction}
        action={confirmModal.action}
        plan={confirmModal.plan}
        newName={confirmModal.newName}
        loading={actionLoading}
      />
    </div>
  );
}