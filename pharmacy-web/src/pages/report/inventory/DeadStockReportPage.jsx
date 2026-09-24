// pharmacy-web/src/pages/report/inventory/DeadStockReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/inventory/DeadStockReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { TrendingDown } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import ReportPagination from "../shared/ReportPagination";

const LIMIT = 50;

const defaultFilters = () => ({
  daysThreshold: "90",
  category: "",
  branchId: "",
});

const COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category", align: "center" },
  { key: "current_stock", label: "Stock Quantity", align: "center" },
  {
    key: "stock_value",
    label: "Locked Value (MRP)",
    align: "right",
    render: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "last_sale_date",
    label: "Last Sale Date",
    align: "center",
    render: (v) =>
      v
        ? new Date(v).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "No sales recorded (Opening Stock)",
  },
  {
    key: "days_since_last_sale",
    label: "Days Inactive",
    align: "center",
    render: (v) => (
      <span className={`font-semibold px-2 py-0.5 rounded ${v >= 180 ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"}`}>
        {v} days
      </span>
    ),
  },
  { key: "branch_name", label: "Branch Location" },
];

const EXPORT_COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  { key: "current_stock", label: "Stock Qty" },
  { key: "stock_value", label: "Locked Capital Value" },
  { key: "last_sale_date", label: "Last Sale Date" },
  { key: "days_since_last_sale", label: "Days Since Last Transaction" },
  { key: "branch_name", label: "Branch" },
];

const DeadStockReportPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await inventoryAPI.getFacets();
        if (res?.success && res.data) {
          setCategories(res.data.categories.map((c) => ({ value: c, label: c })));
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
      const res = await reportsAPI.getDeadStockReport({
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
      key: "daysThreshold",
      label: "Days Inactive Threshold",
      type: "select",
      options: [
        { value: "30", label: "30+ Days" },
        { value: "60", label: "60+ Days" },
        { value: "90", label: "90+ Days (Quarterly)" },
        { value: "180", label: "180+ Days (Half-Year)" },
      ],
    },
    { key: "category", label: "Category", type: "select", options: categories },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  return (
    <ReportPageWrapper
      title="Dead Stock & Non-Moving Assets"
      subtitle="Identify dusty stock containing locked business capital"
      icon={TrendingDown}
      iconColor="text-slate-600"
      iconBg="bg-slate-100"
      isLoading={isLoading}
      exportData={data?.records || []}
      exportFilename="dead_assets_report"
      exportColumns={EXPORT_COLUMNS}
    >
      {data?.summary && (
        <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50/40 p-4 gap-4">
          <div className="p-3 bg-white rounded-xl border border-gray-150 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Total Inactive Batches
            </p>
            <p className="text-xl font-extrabold text-slate-800 mt-1">
              {data.summary.total_dead_items}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-gray-150 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Total Capital Locked In Shelf
            </p>
            <p className="text-xl font-extrabold text-red-600 mt-1">
              ₹{Number(data.summary.total_locked_capital).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      <div className="shrink-0 px-5 py-3 border-b border-gray-100">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable
          columns={COLUMNS}
          rows={data?.records || []}
          emptyMessage="Brilliant! No dead stock matching days inactivity criteria on record"
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

export default DeadStockReportPage;