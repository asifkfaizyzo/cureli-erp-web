// pharmacy-web/src/pages/report/purchase/PurchaseOutstandingPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/purchase/PurchaseOutstandingPage.jsx

import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
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

const defaultFilters = () => ({
  agingBucket: "",
  search: "",
  branchId: "",
});

const COLUMNS = [
  { key: "invoice_number", label: "Invoice No", width: "w-32" },
  { key: "supplier_invoice_no", label: "Supplier Inv No", width: "w-28" },
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
  {
    key: "due_date",
    label: "Due Date",
    width: "w-28",
    render: (v) =>
      v
        ? new Date(v).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
  },
  { key: "supplier_name", label: "Supplier" },
  {
    key: "net_amount",
    label: "Invoice Amt",
    align: "right",
    render: (v) =>
      `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "paid_amount",
    label: "Paid",
    align: "right",
    render: (v) =>
      `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "balance_amount",
    label: "Balance Due",
    align: "right",
    render: (v) => (
      <span className="font-bold text-red-600">
        ₹{Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "days_overdue",
    label: "Days",
    align: "center",
    render: (v) => {
      const color =
        v <= 0
          ? "text-green-600"
          : v <= 30
            ? "text-amber-600"
            : v <= 60
              ? "text-orange-600"
              : "text-red-600";
      return <span className={`font-semibold ${color}`}>{v}</span>;
    },
  },
  {
    key: "aging_bucket",
    label: "Bucket",
    align: "center",
    render: (v) => {
      const labels = {
        current: "Current",
        "1_30": "1–30d",
        "31_60": "31–60d",
        "61_90": "61–90d",
        "90_plus": "90+d",
      };
      const colors = {
        current: "bg-green-100 text-green-700",
        "1_30": "bg-amber-100 text-amber-700",
        "31_60": "bg-orange-100 text-orange-700",
        "61_90": "bg-red-100 text-red-700",
        "90_plus": "bg-red-200 text-red-800",
      };
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[v] || "bg-gray-100"}`}
        >
          {labels[v] || v}
        </span>
      );
    },
  },
];

const EXPORT_COLUMNS = [
  { key: "invoice_number", label: "Invoice No" },
  { key: "supplier_invoice_no", label: "Supplier Inv No" },
  { key: "invoice_date", label: "Date" },
  { key: "due_date", label: "Due Date" },
  { key: "supplier_name", label: "Supplier" },
  { key: "net_amount", label: "Invoice Amount" },
  { key: "paid_amount", label: "Paid" },
  { key: "balance_amount", label: "Balance Due" },
  { key: "days_overdue", label: "Days Overdue" },
  { key: "aging_bucket", label: "Aging Bucket" },
];

const PurchaseOutstandingPage = () => {
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
      const res = await reportsAPI.getPurchaseOutstanding({
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
    {
      key: "agingBucket",
      label: "Aging Bucket",
      type: "select",
      options: [
        { value: "current", label: "Current" },
        { value: "1_30", label: "1–30 Days" },
        { value: "31_60", label: "31–60 Days" },
        { value: "61_90", label: "61–90 Days" },
        { value: "90_plus", label: "90+ Days" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
    {
      key: "search",
      label: "",
      type: "search",
      placeholder: "Search invoice / supplier...",
    },
  ];

  const sm = data?.summary;
  const buckets = data?.aging_buckets;

  return (
    <ReportPageWrapper
      title="Purchase Outstanding & Payables"
      subtitle="Unpaid purchase invoices with aging analysis"
      icon={AlertCircle}
      iconColor="text-red-600"
      iconBg="bg-red-100"
      isLoading={isLoading}
      exportData={data?.invoices || []}
      exportFilename="purchase_outstanding"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard label="Total Invoices" value={sm.total_invoices} color="indigo" />
            <StatCard
              label="Total Billed"
              value={`₹${sm.total_billed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="blue"
            />
            <StatCard
              label="Total Paid"
              value={`₹${sm.total_paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="green"
            />
            <StatCard
              label="Outstanding"
              value={`₹${sm.total_outstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="red"
            />
          </div>
        )}

        {buckets && (
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(buckets).map(([key, b]) => (
              <div
                key={key}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() =>
                  handleFilterChange(
                    "agingBucket",
                    filters.agingBucket === key ? "" : key,
                  )
                }
              >
                <p className="text-[10px] font-semibold text-gray-500">{b.label}</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  ₹{b.amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-gray-400">{b.count} invoices</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable
          columns={COLUMNS}
          rows={data?.invoices || []}
          emptyMessage="No outstanding purchase invoices"
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

export default PurchaseOutstandingPage;