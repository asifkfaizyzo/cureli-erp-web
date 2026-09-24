// pharmacy-web/src/pages/report/inventory/MinStockReorderReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/inventory/MinStockReorderReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
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
  manufacturer: "",
  branchId: "",
});

const COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category", align: "center" },
  { key: "minimum_level", label: "Min Stock Limit", align: "center" },
  { key: "reorder_point", label: "Reorder Trigger", align: "center" },
  {
    key: "current_stock",
    label: "Total Stock",
    align: "center",
    render: (v) => <span className="text-red-600 font-bold">{v}</span>,
  },
  {
    key: "shortage",
    label: "Shortage Required",
    align: "center",
    render: (v) => <span className="text-red-700 font-black">+{v}</span>,
  },
  {
    key: "last_purchase_date",
    label: "Last Purchase Date",
    align: "center",
    render: (v) =>
      v
        ? new Date(v).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
  },
  {
    key: "last_purchase_rate",
    label: "Last Cost Rate",
    align: "right",
    render: (v) => (v ? `₹${Number(v).toFixed(2)}` : "-"),
  },
  { key: "last_supplier_name", label: "Last Supplier Used" },
];

const EXPORT_COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  { key: "minimum_level", label: "Min Stock Level" },
  { key: "reorder_point", label: "Reorder Point" },
  { key: "current_stock", label: "Current Total Stock" },
  { key: "shortage", label: "Shortage" },
  { key: "last_purchase_date", label: "Last Purchase Date" },
  { key: "last_purchase_rate", label: "Last Rate Paid" },
  { key: "last_supplier_name", label: "Last Supplier" },
];

const MinStockReorderReportPage = () => {
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
      const res = await reportsAPI.getMinStockReport({
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
    { key: "manufacturer", label: "", type: "search", placeholder: "Filter by manufacturer..." },
  ];

  return (
    <ReportPageWrapper
      title="Minimum Stock & Reorder Checklist"
      subtitle="Purchase checklist for items falling below safety replenishment triggers"
      icon={AlertTriangle}
      iconColor="text-amber-600"
      iconBg="bg-amber-100"
      isLoading={isLoading}
      exportData={data?.records || []}
      exportFilename="replenishment_reorder_report"
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
          emptyMessage="Excellent! No medicines are below safety stock thresholds"
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

export default MinStockReorderReportPage;