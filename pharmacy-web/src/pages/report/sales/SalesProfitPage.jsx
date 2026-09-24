// pharmacy-web/src/pages/report/sales/SalesProfitPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/sales/SalesProfitPage.jsx

import { useState, useEffect, useCallback } from "react";
import { TrendingUp } from "lucide-react";
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
    sortBy: "profit",
    manufacturer: "",
    branchId: "",
  };
};

const COLUMNS = [
  { key: "medicine_name", label: "Medicine" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  { key: "total_quantity", label: "Qty Sold", align: "right" },
  {
    key: "avg_purchase_rate",
    label: "Avg Cost (₹)",
    align: "right",
    render: (v) =>
      Number(v) > 0
        ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
        : <span className="text-gray-400 text-[10px]">No cost data</span>,
  },
  {
    key: "avg_selling_rate",
    label: "Avg Rate (₹)",
    align: "right",
    render: (v) =>
      `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "total_revenue",
    label: "Revenue",
    align: "right",
    render: (v) =>
      `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "total_cost",
    label: "Total Cost",
    align: "right",
    render: (v) =>
      Number(v) > 0
        ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
        : <span className="text-gray-400 text-[10px]">—</span>,
  },
  {
    key: "total_gross_profit",
    label: "Gross Profit",
    align: "right",
    render: (v) => {
      const n = Number(v);
      return (
        <span className={n >= 0 ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>
          ₹{n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    key: "avg_margin_percent",
    label: "Margin %",
    align: "right",
    render: (v) => {
      const n = Number(v);
      return (
        <span className={n >= 0 ? "text-green-700" : "text-red-600"}>
          {n.toFixed(1)}%
        </span>
      );
    },
  },
];

const EXPORT_COLUMNS = [
  { key: "medicine_name", label: "Medicine" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  { key: "total_quantity", label: "Qty Sold" },
  { key: "avg_purchase_rate", label: "Avg Cost" },
  { key: "avg_selling_rate", label: "Avg Rate" },
  { key: "total_revenue", label: "Revenue" },
  { key: "total_cost", label: "Total Cost" },
  { key: "total_gross_profit", label: "Gross Profit" },
  { key: "avg_margin_percent", label: "Margin %" },
];

const SalesProfitPage = () => {
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
      const res = await reportsAPI.getSalesProfit({
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
      key: "sortBy",
      label: "Sort By",
      type: "select",
      options: [
        { value: "profit", label: "Profit ↓" },
        { value: "margin", label: "Margin % ↓" },
        { value: "revenue", label: "Revenue ↓" },
        { value: "quantity", label: "Quantity ↓" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
    {
      key: "manufacturer",
      label: "",
      type: "search",
      placeholder: "Filter by manufacturer...",
    },
  ];

  const gt = data?.grand_totals;

  return (
    <ReportPageWrapper
      title="Profit Report"
      subtitle="Gross profit per medicine based on purchase cost vs selling rate"
      icon={TrendingUp}
      iconColor="text-green-600"
      iconBg="bg-green-100"
      isLoading={isLoading}
      exportData={data?.items || []}
      exportFilename="sales_profit"
      exportColumns={EXPORT_COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />

        {/* Grand totals bar */}
        {gt && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <StatCard
              label="Total Revenue"
              value={`₹${gt.total_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="blue"
            />
            <StatCard
              label="Total Cost"
              value={
                gt.total_cost > 0
                  ? `₹${gt.total_cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                  : "No cost data"
              }
              color="gray"
            />
            <StatCard
              label="Gross Profit"
              value={`₹${gt.total_gross_profit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color={gt.total_gross_profit >= 0 ? "green" : "red"}
            />
            <StatCard
              label="Overall Margin"
              value={`${gt.overall_margin_percent}%`}
              color={gt.overall_margin_percent >= 0 ? "green" : "red"}
            />
            <StatCard
              label="Total Qty Sold"
              value={gt.total_quantity}
              color="indigo"
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {gt && gt.total_cost === 0 && (
          <div className="shrink-0 mx-5 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Purchase rates are not available for some or all medicines.
              Profit calculations may be incomplete. Record purchase invoices for accurate profit data.
            </p>
          </div>
        )}
        <ReportTable
          columns={COLUMNS}
          rows={data?.items || []}
          emptyMessage="No sales data found"
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

export default SalesProfitPage;