// pharmacy-web/src/pages/sales/returns/SalesReturnsPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/returns/SalesReturnsPage.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Package,
  Search,
  Filter,
  Calendar,
  Building2,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Shield,
  ChevronDown,
  FileText,
  Ban,
  X,
  Layers,
  Info,
  Plus,
  Users,
} from "lucide-react";
import { useToast } from "../../../components/common/Toast";
import salesAPI from "../../../api/sales";
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
} from "../../../store/useAuthStore";
import ViewSalesReturnModal from "./components/ViewSalesReturnModal";
import SalesReturnsTable from "./components/SalesReturnsTable";
import CreateSalesReturnModal from "./components/CreateSalesReturnModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import StyledSelect from "../../../components/common/StyledSelect";
import StyledDateFilter from "../../../components/common/StyledDateFilter";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const RETURN_REASON_LABELS = {
  EXPIRED_PRODUCT: "Expired Product",
  DAMAGED_PRODUCT: "Damaged Product",
  WRONG_PRODUCT: "Wrong Product",
  CUSTOMER_REQUEST: "Customer Request",
  QUALITY_ISSUE: "Quality Issue",
  PRICE_DISPUTE: "Price Dispute",
  OTHER: "Other",
  // Legacy support
  CUSTOMER_CHANGED_MIND: "Customer Changed Mind",
  WRONG_ITEM_SOLD: "Wrong Item Sold",
  ALLERGIC_REACTION: "Allergic Reaction",
  DOCTOR_ADVISED: "Doctor Advised Return",
};

//  Match schema enum values (CASH, CREDIT, ADJUST_NEXT)
const REFUND_MODE_CONFIG = {
  CASH: {
    label: "Cash Refund",
    color: "emerald",
    icon: "₹",
  },
  CREDIT: {
    label: "Customer Credit",
    color: "blue",
    icon: "📄",
  },
  ADJUST_NEXT: {
    label: "Adjust Next",
    color: "purple",
    icon: "🔄",
  },
  // Legacy support
  CASH_REFUND: {
    label: "Cash Refund",
    color: "emerald",
    icon: "₹",
  },
  CREDIT_NOTE: {
    label: "Customer Credit",
    color: "blue",
    icon: "📄",
  },
  EXCHANGE: {
    label: "Exchange",
    color: "purple",
    icon: "🔄",
  },
};

const APPROVAL_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const formatCurrency = (value) => {
  const num = Math.abs(parseFloat(value) || 0);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ════════════════════════════════════════════════════════════════════════════
// BRANCH CONTEXT BANNER
// ════════════════════════════════════════════════════════════════════════════

const BranchContextBanner = ({ isGlobalMode, branchName, itemCount }) => {
  if (isGlobalMode) {
    return (
      <div className="px-4 py-2 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Layers size={16} className="text-blue-500" />
          <span>
            Viewing returns from <strong>All Branches</strong>
          </span>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            Combined View
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <Info size={12} />
          <span>Select a specific branch to create or approve returns</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-green-700">
        <Building2 size={16} className="text-green-500" />
        <span>
          Viewing returns for <strong>{branchName || "Selected Branch"}</strong>
        </span>
        {itemCount > 0 && (
          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
            {itemCount} returns
          </span>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// APPROVAL QUEUE CARD (For Super Admin)
// ════════════════════════════════════════════════════════════════════════════

const ApprovalQueueCard = ({ pendingReturns, onViewReturn }) => {
  const totalPendingAmount = useMemo(() => {
    return pendingReturns.reduce(
      (sum, ret) => sum + Math.abs(parseFloat(ret.net_amount) || 0),
      0,
    );
  }, [pendingReturns]);

  if (pendingReturns.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900">
              Pending Approvals
            </h3>
            <p className="text-xs text-amber-700">
              {pendingReturns.length} return
              {pendingReturns.length !== 1 ? "s" : ""} awaiting approval
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-amber-600 uppercase tracking-wider mb-0.5">
            Total Amount
          </p>
          <p className="text-lg font-bold text-amber-900">
            {formatCurrency(totalPendingAmount)}
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {pendingReturns.slice(0, 5).map((returnInvoice) => (
          <div
            key={returnInvoice.invoice_id}
            className="bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onViewReturn(returnInvoice)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-mono font-bold text-sm text-[#000060]">
                    {returnInvoice.invoice_number}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                    {RETURN_REASON_LABELS[returnInvoice.return_reason] ||
                      returnInvoice.return_reason}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1 truncate">
                    <Users size={12} />
                    {returnInvoice.customer?.name ||
                      returnInvoice.walkin_name ||
                      "Walk-in Customer"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(
                      returnInvoice.invoice_date || returnInvoice.created_at,
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {returnInvoice._count?.lineItems || 0} items
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-3">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">Amount</p>
                  <p className="text-sm font-bold text-[#000060]">
                    {formatCurrency(returnInvoice.net_amount)}
                  </p>
                </div>
                <button className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                  <Eye size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {pendingReturns.length > 5 && (
          <p className="text-xs text-amber-700 text-center py-1">
            +{pendingReturns.length - 5} more pending returns
          </p>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// FILTERS COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const ReturnsFilters = ({ filters, onFilterChange, onReset }) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.approvalStatus ||
    filters.search;

  const activeFilterCount = [
    filters.startDate,
    filters.endDate,
    filters.approvalStatus,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-[#000060] transition-colors"
        >
          <Filter size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#000060] text-white rounded-full min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X size={12} />
            Reset All
          </button>
        )}
      </div>

      {showFilters && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-shrink-0">
              <StyledDateFilter
                label="From Date"
                date={filters.startDate}
                setDate={(value) => onFilterChange("startDate", value)}
              />
            </div>

            <div className="flex-shrink-0">
              <StyledDateFilter
                label="To Date"
                date={filters.endDate}
                setDate={(value) => onFilterChange("endDate", value)}
              />
            </div>

            <div className="w-48 flex-shrink-0">
              <StyledSelect
                label="Approval Status"
                value={filters.approvalStatus}
                onChange={(value) => onFilterChange("approvalStatus", value)}
                options={APPROVAL_STATUS_OPTIONS}
                placeholder="All Statuses"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">
                Search
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    filters.search ? "text-[#000060]" : "text-gray-400"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Return number, customer..."
                  value={filters.search || ""}
                  onChange={(e) => onFilterChange("search", e.target.value)}
                  className={`w-full h-10 pl-10 pr-10 text-sm border rounded-lg shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060]
                    transition-all duration-200
                    ${
                      filters.search
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                />
                {filters.search && (
                  <button
                    onClick={() => onFilterChange("search", "")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-indigo-200 text-indigo-500 transition-colors"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">
                  Active Filters:
                </span>

                {filters.startDate && (
                  <FilterTag
                    label={`From: ${formatDate(filters.startDate)}`}
                    onRemove={() => onFilterChange("startDate", "")}
                  />
                )}

                {filters.endDate && (
                  <FilterTag
                    label={`To: ${formatDate(filters.endDate)}`}
                    onRemove={() => onFilterChange("endDate", "")}
                  />
                )}

                {filters.approvalStatus && (
                  <FilterTag
                    label={
                      APPROVAL_STATUS_OPTIONS.find(
                        (o) => o.value === filters.approvalStatus,
                      )?.label || filters.approvalStatus
                    }
                    onRemove={() => onFilterChange("approvalStatus", "")}
                  />
                )}

                {filters.search && (
                  <FilterTag
                    label={`"${filters.search}"`}
                    onRemove={() => onFilterChange("search", "")}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FilterTag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#000060]/10 text-[#000060] rounded-lg text-xs font-medium">
    {label}
    <button
      onClick={onRemove}
      className="p-0.5 hover:bg-[#000060]/20 rounded-full transition-colors"
    >
      <X size={10} strokeWidth={2.5} />
    </button>
  </span>
);

// ════════════════════════════════════════════════════════════════════════════
// STATS CARDS COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const StatsCards = ({ stats }) => {
  const cards = [
    {
      label: "Total Returns",
      value: stats.total,
      icon: Package,
      color: "slate",
      bgColor: "bg-white",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "amber",
      bgColor: "bg-amber-50",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "green",
      bgColor: "bg-green-50",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "red",
      bgColor: "bg-red-50",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: Ban,
      color: "gray",
      bgColor: "bg-gray-50",
    },
  ];

  const colorMap = {
    slate: {
      text: "text-[#000060]",
      icon: "text-[#000060]",
      border: "border-slate-200",
    },
    amber: {
      text: "text-amber-700",
      icon: "text-amber-600",
      border: "border-amber-200",
    },
    green: {
      text: "text-green-700",
      icon: "text-green-600",
      border: "border-green-200",
    },
    red: {
      text: "text-red-700",
      icon: "text-red-600",
      border: "border-red-200",
    },
    gray: {
      text: "text-gray-700",
      icon: "text-gray-600",
      border: "border-gray-200",
    },
  };

  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const colors = colorMap[card.color];
        return (
          <div
            key={card.label}
            className={`${card.bgColor} rounded-xl border ${colors.border} p-3 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className={`text-xs font-medium ${colors.text}`}>
                {card.label}
              </p>
              <Icon size={16} className={colors.icon} />
            </div>
            <p className={`text-xl font-bold ${colors.text}`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const SalesReturnsPage = () => {
  const toast = useToast();

  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const user = useAuthStore((state) => state.user);

  const isGlobalMode = branchContext.mode === "GLOBAL";
  const currentBranchId = branchContext.branch_id;
  const currentBranchName = branchContext.branch_name;

  const prevBranchRef = useRef({
    mode: branchContext.mode,
    branch_id: branchContext.branch_id,
  });

  // State
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBranchSwitching, setIsBranchSwitching] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    approvalStatus: "",
    search: "",
  });

  // Modals
  const [viewReturnModal, setViewReturnModal] = useState({
    open: false,
    returnData: null,
  });

  const [createReturnModal, setCreateReturnModal] = useState({
    open: false,
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  // Computed
  const pendingReturns = useMemo(() => {
    return returns.filter(
      (r) => r.return_approval_status === "PENDING_APPROVAL",
    );
  }, [returns]);

  const filteredReturns = useMemo(() => {
    let result = [...returns];

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          //  FIX: Search by invoice_number instead of return_number
          r.invoice_number?.toLowerCase().includes(query) ||
          r.customer?.name?.toLowerCase().includes(query) ||
          r.customer?.phone?.includes(query) ||
          r.walkin_name?.toLowerCase().includes(query) ||
          r.walkin_phone?.includes(query),
      );
    }

    return result;
  }, [returns, filters.search]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: total,
      pending: returns.filter(
        (r) => r.return_approval_status === "PENDING_APPROVAL",
      ).length,
      approved: returns.filter((r) => r.return_approval_status === "APPROVED")
        .length,
      rejected: returns.filter((r) => r.return_approval_status === "REJECTED")
        .length,
      cancelled: returns.filter((r) => r.return_approval_status === "CANCELLED")
        .length,
    };
  }, [returns, total]);

  // ══════════════════════════════════════════════════════════════════════
  // LOAD RETURNS
  // ══════════════════════════════════════════════════════════════════════

  const loadReturns = useCallback(
    async (showBranchSwitchingState = false) => {
      try {
        if (showBranchSwitchingState) {
          setIsBranchSwitching(true);
        } else {
          setLoading(true);
        }

        const params = { ...filters };

        Object.keys(params).forEach((key) => {
          if (
            params[key] === "" ||
            params[key] === null ||
            params[key] === undefined
          ) {
            delete params[key];
          }
        });

        const response = await salesAPI.getAllReturns(params);
        setReturns(response.data?.returns || []);
        setTotal(response.data?.total || 0);
      } catch (error) {
        console.error("Load returns error:", error);
        toast.error(
          "Failed to Load Returns",
          error.response?.data?.message || error.message,
        );
      } finally {
        setLoading(false);
        setIsBranchSwitching(false);
      }
    },
    [filters, branchContext.mode, branchContext.branch_id, toast],
  );

  // Watch for branch changes
  useEffect(() => {
    const prevBranch = prevBranchRef.current;
    const branchChanged =
      prevBranch.mode !== branchContext.mode ||
      prevBranch.branch_id !== branchContext.branch_id;

    if (branchChanged) {
      prevBranchRef.current = {
        mode: branchContext.mode,
        branch_id: branchContext.branch_id,
      };

      setReturns([]);

      if (branchContext.mode === "GLOBAL") {
        toast.info(
          "Switched to All Branches",
          "Loading combined returns data...",
        );
      } else if (branchContext.branch_name) {
        toast.info(
          "Branch Changed",
          `Loading returns for ${branchContext.branch_name}...`,
        );
      }

      loadReturns(true);
    }
  }, [
    branchContext.mode,
    branchContext.branch_id,
    branchContext.branch_name,
    toast,
    loadReturns,
  ]);

  // Initial load and filter changes
  useEffect(() => {
    loadReturns();
  }, [filters.startDate, filters.endDate, filters.approvalStatus]);

  // ══════════════════════════════════════════════════════════════════════
  // FILTER HANDLERS
  // ══════════════════════════════════════════════════════════════════════

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      approvalStatus: "",
      search: "",
    });
  };

  const handleRefresh = () => {
    loadReturns(false);
  };

  // ══════════════════════════════════════════════════════════════════════
  // CLOSE VIEW MODAL
  // ══════════════════════════════════════════════════════════════════════

  const closeViewModal = () => {
    setViewReturnModal({ open: false, returnData: null });
  };

  // ══════════════════════════════════════════════════════════════════════
  // VIEW RETURN
  // ══════════════════════════════════════════════════════════════════════

  const handleViewReturn = async (returnData) => {
    try {
      const returnId = returnData.invoice_id;

      if (!returnId) {
        toast.error("Invalid return", "Return ID is missing");
        return;
      }

      const response = await salesAPI.getReturnById(returnId);
      setViewReturnModal({ open: true, returnData: response.data });
    } catch (error) {
      console.error("Failed to get return details:", error);
      toast.error(
        "Failed to load return details",
        error.response?.data?.message || error.message,
      );
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // APPROVE RETURN
  // ══════════════════════════════════════════════════════════════════════

  const handleApproveReturn = (returnData) => {
    //  Get refund_mode with fallback to adjustment_type
    const refundMode = returnData.refund_mode || returnData.adjustment_type;
    const refundConfig = REFUND_MODE_CONFIG[refundMode];

    setConfirmDialog({
      isOpen: true,
      type: "success",
      title: "Approve Sales Return",
      message: (
        <div className="space-y-3">
          <p>You are about to approve this sales return.</p>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="font-semibold text-gray-900">
              Return: {returnData.invoice_number}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Amount: {formatCurrency(returnData.net_amount)}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">This will:</p>
            <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
              <li>Add stock back to inventory</li>
              <li>
                Process refund/credit (
                {refundConfig?.label || refundMode || "N/A"})
              </li>
              <li>Mark return as approved</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: "Approve Return",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        await performApproval(returnData);
      },
    });
  };

  const performApproval = async (returnData) => {
    try {
      setActionLoading(true);
      const returnId = returnData.invoice_id;
      await salesAPI.approveReturn(returnId, { action: "APPROVE" });

      toast.success(
        "Return Approved",
        "Stock restored and refund/credit processed.",
      );
      closeViewModal();
      loadReturns(false);
    } catch (error) {
      console.error("Approve return error:", error);
      toast.error(
        "Approval Failed",
        error.response?.data?.message || error.message,
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // REJECT RETURN
  // ══════════════════════════════════════════════════════════════════════

  const handleRejectReturn = (returnData) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Reject Sales Return",
      message: (
        <div className="space-y-3">
          <p>You are about to reject this sales return.</p>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="font-semibold text-gray-900">
              Return: {returnData.invoice_number}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Amount: {formatCurrency(returnData.net_amount)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-500 ml-2">
                (minimum 10 characters)
              </span>
            </label>
            <textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection (at least 10 characters)..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm"
            />
          </div>
          <p className="text-sm text-red-600 font-medium">
            ⚠️ This action cannot be undone.
          </p>
        </div>
      ),
      confirmText: "Reject Return",
      onConfirm: async () => {
        const reason = document
          .getElementById("rejection-reason")
          ?.value.trim();
        if (!reason || reason.length < 10) {
          toast.warning(
            "Reason Required",
            "Please provide a rejection reason (minimum 10 characters).",
          );
          return;
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        await performRejection(returnData, reason);
      },
    });
  };

  const performRejection = async (returnData, reason) => {
    try {
      setActionLoading(true);
      const returnId = returnData.invoice_id;
      await salesAPI.rejectReturn(returnId, reason);

      toast.success("Return Rejected", "Return has been rejected.");
      closeViewModal();
      loadReturns(false);
    } catch (error) {
      console.error("Reject return error:", error);
      toast.error(
        "Rejection Failed",
        error.response?.data?.message || error.message,
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // CANCEL APPROVED RETURN
  // ══════════════════════════════════════════════════════════════════════

  const handleCancelReturn = async (returnData, data) => {
    try {
      setActionLoading(true);
      const returnId = returnData.invoice_id;

      await salesAPI.cancelApprovedReturn(returnId, data);

      toast.success(
        "Return Cancelled",
        "Stock has been deducted and customer credits have been cancelled.",
      );
      closeViewModal();
      loadReturns(false);
    } catch (error) {
      console.error("Cancel return error:", error);
      toast.error(
        "Cancellation Failed",
        error.response?.data?.message || error.message,
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // REVERT TO PENDING
  // ══════════════════════════════════════════════════════════════════════

  const handleRevertReturn = async (returnData, reason) => {
    try {
      setActionLoading(true);
      const returnId = returnData.invoice_id;

      await salesAPI.revertReturnToPending(returnId, { revert_reason: reason });

      toast.success(
        "Return Reverted",
        "Return has been reverted to pending approval.",
      );
      closeViewModal();
      loadReturns(false);
    } catch (error) {
      console.error("Revert return error:", error);
      toast.error(
        "Revert Failed",
        error.response?.data?.message || error.message,
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // CREATE RETURN SUCCESS
  // ══════════════════════════════════════════════════════════════════════

  const handleCreateReturnSuccess = () => {
    setCreateReturnModal({ open: false });
    loadReturns(false);
  };

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div className="h-full flex flex-col p-4 max-w-[1800px] mx-auto">
      {/* Branch Context Banner */}
      {isSuperAdmin && (
        <BranchContextBanner
          isGlobalMode={isGlobalMode}
          branchName={currentBranchName}
          itemCount={total}
        />
      )}

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between mb-4 mt-4">
        <div>
          <h1 className="text-2xl font-bold text-[#000060]">Sales Returns</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage customer returns and refund workflow
            {isSuperAdmin && (
              <span className="ml-2 text-amber-600 font-medium">
                • Super Admin Mode
              </span>
            )}
            {isGlobalMode && (
              <span className="ml-2 text-blue-600 font-medium">
                • Viewing All Branches
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isGlobalMode && (
            <button
              onClick={() => setCreateReturnModal({ open: true })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Plus size={16} />
              New Return
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing || actionLoading || isBranchSwitching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#000060] text-white text-sm font-medium hover:bg-[#000060]/90 transition-colors disabled:opacity-50 shadow-lg shadow-[#000060]/20"
          >
            <RefreshCw
              size={16}
              className={refreshing || isBranchSwitching ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="shrink-0">
        <StatsCards stats={stats} />
      </div>

      {/* Approval Queue (Super Admin Only) */}
      {isSuperAdmin && pendingReturns.length > 0 && (
        <div className="shrink-0">
          <ApprovalQueueCard
            pendingReturns={pendingReturns}
            onViewReturn={handleViewReturn}
          />
        </div>
      )}

      {/* Filters */}
      <div className="shrink-0 mb-4">
        <ReturnsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 relative">
        {isBranchSwitching && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="w-10 h-10 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Switching Branch
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Loading returns for{" "}
                  {isGlobalMode ? "all branches" : currentBranchName}...
                </p>
              </div>
            </div>
          </div>
        )}

        <SalesReturnsTable
          data={filteredReturns}
          loading={loading}
          actionLoading={actionLoading}
          onViewReturn={handleViewReturn}
        />
      </div>

      {/* View Return Modal */}
      <ViewSalesReturnModal
        open={viewReturnModal.open}
        onClose={closeViewModal}
        returnData={viewReturnModal.returnData}
        onApprove={handleApproveReturn}
        onReject={handleRejectReturn}
        onCancel={handleCancelReturn}
        onRevert={handleRevertReturn}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Create Return Modal */}
      <CreateSalesReturnModal
        open={createReturnModal.open}
        onClose={() => setCreateReturnModal({ open: false })}
        onSuccess={handleCreateReturnSuccess}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        type={confirmDialog.type}
      />

      {/* Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-[#000060]/30 border-t-[#000060] rounded-full animate-spin" />
            <p className="text-lg font-medium text-gray-700">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReturnsPage;
