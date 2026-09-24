// pharmacy-web/src/pages/report/purchase/PurchaseReturnsPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/purchase/PurchaseReturnsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import ReportPagination from "../shared/ReportPagination";
import StatCard from "../shared/StatCard";

const LIMIT = 50;

const defaultFilters = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: firstOfMonth.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    returnReason: "",
    approvalStatus: "",
    search: "",
    branchId: "",
  };
};

const COLUMNS = [
  { key: "invoice_number", label: "Return No", width: "w-32" },
  {
    key: "invoice_date",
    label: "Date",
    width: "w-28",
    render: (v) =>
      new Date(v).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
  { key: "parent_invoice_number", label: "Original Invoice" },
  { key: "supplier_name", label: "Supplier" },
  {
    key: "return_reason",
    label: "Reason",
    render: (v) => v?.replace(/_/g, " ") || "-",
  },
  {
    key: "return_approval_status",
    label: "Status",
    align: "center",
    render: (v) => {
      const colors = {
        APPROVED: "bg-green-100 text-green-700",
        PENDING_APPROVAL: "bg-amber-100 text-amber-700",
        REJECTED: "bg-red-100 text-red-700",
        CANCELLED: "bg-gray-100 text-gray-600",
      };
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[v] || "bg-gray-100 text-gray-600"}`}
        >
          {v?.replace("_", " ") || "-"}
        </span>
      );
    },
  },
  { key: "credit_note_number", label: "Credit Note", render: (v) => v || "-" },
  {
    key: "refund_mode",
    label: "Refund Mode",
    align: "center",
    render: (v) => v || "-",
  },
  {
    key: "net_amount",
    label: "Return Value",
    align: "right",
    render: (v) => (
      <span className="font-semibold text-red-600">
        ₹{Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  { key: "approved_by", label: "Approved By" },
];

const EXPORT_COLUMNS = [
  { key: "invoice_number", label: "Return No" },
  { key: "invoice_date", label: "Date" },
  { key: "parent_invoice_number", label: "Original Invoice" },
  { key: "supplier_name", label: "Supplier" },
  { key: "return_reason", label: "Reason" },
  { key: "return_approval_status", label: "Status" },
  { key: "credit_note_number", label: "Credit Note" },
  { key: "refund_mode", label: "Refund Mode" },
  { key: "net_amount", label: "Return Value" },
  { key: "approved_by", label: "Approved By" },
];

const PurchaseReturnsPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await inventoryAPI.getFacets();
        if (res?.success && res.data) {
          setBranches(res.data.branches.map((b) => ({ value: b.branch_id, label: b.branch_name })));
        }
      } catch (err) {
        console.error("Facets error:", err);
      }
    };
    fetchMetadata();
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportsAPI.getPurchaseReturnsReport({
        ...filters,
        limit: LIMIT,
        offset,
      });
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, offset, branchContext]); // eslint-disable-line

  useEffect(() => {
    setOffset(0);
    load();
  }, [branchContext, load]);

  const handleFilterChange = (key, value) => {
    setOffset(0);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setOffset(0);
    setFilters(defaultFilters());
  };

  const filterConfig = [
    { key: "startDate", label: "From Date", type: "date" },
    { key: "endDate", label: "To Date", type: "date" },
    {
      key: "returnReason",
      label: "Return Reason",
      type: "select",
      options: [
        { value: "EXPIRED_PRODUCT", label: "Expired" },
        { value: "DAMAGED_PRODUCT", label: "Damaged" },
        { value: "WRONG_PRODUCT", label: "Wrong Product" },
        { value: "QUALITY_ISSUE", label: "Quality Issue" },
        { value: "OVERSTOCK", label: "Overstock" },
        { value: "SUPPLIER_RECALL", label: "Supplier Recall" },
        { value: "OTHER", label: "Other" },
      ],
    },
    {
      key: "approvalStatus",
      label: "Status",
      type: "select",
      options: [
        { value: "PENDING_APPROVAL", label: "Pending" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
    {
      key: "search",
      label: "",
      type: "search",
      placeholder: "Search return / supplier...",
    },
  ];

  const sm = data?.summary;

  return (
    <ReportPageWrapper
      title="Purchase Returns"
      subtitle="All purchase return invoices — what was returned to suppliers and why"
      icon={RotateCcw}
      iconColor="text-red-600"
      iconBg="bg-red-100"
      isLoading={isLoading}
      exportData={data?.returns || []}
      exportFilename="purchase_returns"
      exportColumns={EXPORT_COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />
        {sm && (
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Total Returns" value={sm.total_returns} color="red" />
            <StatCard
              label="Total Return Value"
              value={`₹${sm.total_return_value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="amber"
            />
            <StatCard
              label="Total Refunded"
              value={`₹${sm.total_refunded.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="gray"
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable
          columns={COLUMNS}
          rows={data?.returns || []}
          emptyMessage="No purchase returns found"
        />
        <ReportPagination
          total={data?.total || 0}
          limit={LIMIT}
          offset={offset}
          onPageChange={setOffset}
        />
      </div>
    </ReportPageWrapper>
  );
};

export default PurchaseReturnsPage;