// pharmacy-web/src/pages/report/inventory/CurrentStockReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/inventory/CurrentStockReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Layers } from "lucide-react";
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
  category: "",
  stockLevel: "",
  search: "",
  branchId: "",
});

const COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category", align: "center" },
  { key: "batch_number", label: "Batch", align: "center" },
  {
    key: "expiry_date",
    label: "Expiry",
    align: "center",
    render: (v) =>
      v
        ? new Date(v).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          })
        : "-",
  },
  { key: "current_stock", label: "Stock Qty", align: "center" },
  { key: "available_stock", label: "Avail Qty", align: "center" },
  { key: "reserved_stock", label: "Reserved", align: "center" },
  {
    key: "mrp",
    label: "MRP",
    align: "right",
    render: (v) => `₹${Number(v).toFixed(2)}`,
  },
  {
    key: "selling_rate",
    label: "Selling Rate",
    align: "right",
    render: (v) => `₹${Number(v).toFixed(2)}`,
  },
  { key: "rack_no", label: "Rack No", align: "center" },
  {
    key: "status",
    label: "Status",
    align: "center",
    render: (v) => {
      const colors = {
        "In Stock": "bg-green-50 text-green-700 border-green-200",
        "Low Stock": "bg-amber-50 text-amber-700 border-amber-200",
        "Out of Stock": "bg-red-50 text-red-700 border-red-200",
        "Expired": "bg-gray-100 text-gray-700 border-gray-300",
        "Expiring Soon": "bg-orange-50 text-orange-700 border-orange-200",
      };
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[v] || "bg-gray-50 text-gray-600"}`}>
          {v}
        </span>
      );
    },
  },
];

const EXPORT_COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  { key: "batch_number", label: "Batch" },
  { key: "expiry_date", label: "Expiry" },
  { key: "current_stock", label: "Stock Qty" },
  { key: "available_stock", label: "Avail Qty" },
  { key: "reserved_stock", label: "Reserved Qty" },
  { key: "mrp", label: "MRP" },
  { key: "selling_rate", label: "Selling Rate" },
  { key: "rack_no", label: "Rack" },
  { key: "status", label: "Status" },
  { key: "branch_name", label: "Branch" },
];

const CurrentStockReportPage = () => {
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
      const res = await reportsAPI.getCurrentStockReport({
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
    { key: "category", label: "Category", type: "select", options: categories },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
    {
      key: "stockLevel",
      label: "Stock Level",
      type: "select",
      options: [
        { value: "In Stock", label: "In Stock" },
        { value: "Low Stock", label: "Low Stock" },
        { value: "Out of Stock", label: "Out of Stock" },
        { value: "Expired", label: "Expired" },
        { value: "Expiring Soon", label: "Expiring Soon" },
      ],
    },
    { key: "search", label: "", type: "search", placeholder: "Search medicine or batch..." },
  ];

  return (
    <ReportPageWrapper
      title="Current Stock Snapshot"
      subtitle="Complete layout of current physical items on shelf"
      icon={Layers}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-100"
      isLoading={isLoading}
      exportData={data?.records || []}
      exportFilename="current_stock_report"
      exportColumns={EXPORT_COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
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
          emptyMessage="No stock inventory recorded"
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

export default CurrentStockReportPage;