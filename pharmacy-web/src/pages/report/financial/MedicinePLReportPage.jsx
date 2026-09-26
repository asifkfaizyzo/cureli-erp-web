// pharmacy-web/src/pages/report/financial/MedicinePLReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/financial/MedicinePLReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
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
    category: "",
    manufacturer: "",
    branchId: "",
  };
};

const COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category", align: "center" },
  { key: "quantity_sold", label: "Quantity Sold", align: "center" },
  {
    key: "total_revenue",
    label: "Total Revenue",
    align: "right",
    render: (v) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "total_cost",
    label: "Total COGS",
    align: "right",
    render: (v) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "gross_profit",
    label: "Gross Profit",
    align: "right",
    render: (v) => {
      const isNegative = v < 0;
      return (
        <span className={`font-bold ${isNegative ? "text-red-600" : "text-green-700"}`}>
          ₹{v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    key: "gross_margin_percent",
    label: "Margin %",
    align: "right",
    render: (v) => {
      const isNegative = v < 0;
      return (
        <span className={`font-semibold ${isNegative ? "text-red-600" : "text-green-700"}`}>
          {v.toFixed(1)}%
        </span>
      );
    },
  },
];

const EXPORT_COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  { key: "quantity_sold", label: "Quantity Sold" },
  { key: "total_revenue", label: "Total Revenue" },
  { key: "total_cost", label: "Total Cost of Goods" },
  { key: "gross_profit", label: "Gross Profit" },
  { key: "gross_margin_percent", label: "Gross Margin %" },
];

const MedicinePLReportPage = () => {
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
      const res = await reportsAPI.getMedicinePLReport({
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
    { key: "category", label: "Category", type: "select", options: categories },
    {
      key: "sortBy",
      label: "Sort By",
      type: "select",
      options: [
        { value: "profit", label: "Profit amount" },
        { value: "margin", label: "Margin %" },
        { value: "revenue", label: "Revenue" },
        { value: "quantity", label: "Quantity sold" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
    { key: "manufacturer", label: "", type: "search", placeholder: "Filter by manufacturer..." },
  ];

  const sm = data?.summary;

  return (
    <ReportPageWrapper
      title="Product-wise Profit & Loss"
      subtitle="Gross profit evaluations aggregated down to single line items"
      icon={TrendingUp}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-100"
      isLoading={isLoading}
      exportData={data?.records || []}
      exportFilename="medicine_pl_report"
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
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Total Sales Revenue" value={`₹${sm.total_revenue.toLocaleString("en-IN")}`} color="blue" />
            <StatCard label="Total Cost of Goods (COGS)" value={`₹${sm.total_cost_of_goods.toLocaleString("en-IN")}`} color="gray" />
            <StatCard label="Gross Profit" value={`₹${sm.total_gross_profit.toLocaleString("en-IN")}`} color={sm.total_gross_profit > 0 ? "green" : "red"} />
            <StatCard label="Gross Profit Margin %" value={`${sm.overall_margin.toFixed(1)}%`} color="indigo" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable columns={COLUMNS} rows={data?.records || []} emptyMessage="No sales recorded under criteria parameters" />
        <ReportPagination total={data?.total || 0} limit={LIMIT} offset={offset} onPageChange={setOffset} />
      </div>
    </ReportPageWrapper>
  );
};

export default MedicinePLReportPage;