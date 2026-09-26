// pharmacy-web/src/pages/report/financial/PeriodPLReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/financial/PeriodPLReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import StatCard from "../shared/StatCard";

const defaultFilters = () => {
  const today = new Date();
  const firstOfYear = new Date(today.getFullYear(), 0, 1);
  return {
    startDate: firstOfYear.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    branchId: "",
  };
};

const COLUMNS = [
  { key: "period", label: "Period (Month / Year)" },
  {
    key: "revenue",
    label: "Total Sales Revenue",
    align: "right",
    render: (v) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "cost_of_goods_sold",
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
    label: "Gross Margin %",
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

const PeriodPLReportPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
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
      const res = await reportsAPI.getPeriodPLReport(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, branchContext]); // eslint-disable-line

  useEffect(() => {
    load();
  }, [branchContext, load]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters(defaultFilters());
  };

  const filterConfig = [
    { key: "startDate", label: "From Date", type: "date" },
    { key: "endDate", label: "To Date", type: "date" },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  const sm = data?.summary;

  return (
    <ReportPageWrapper
      title="Period-wise Profit & Loss"
      subtitle="Track COGS and gross margins across months to monitor financial trends"
      icon={TrendingUp}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-100"
      isLoading={isLoading}
      exportData={data?.trend || []}
      exportFilename="period_pl_trends_report"
      exportColumns={COLUMNS}
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
            <StatCard label="Aggregate Period Revenue" value={`₹${sm.total_revenue.toLocaleString("en-IN")}`} color="blue" />
            <StatCard label="Aggregate Cost of Goods (COGS)" value={`₹${sm.cost_of_goods_sold.toLocaleString("en-IN")}`} color="gray" />
            <StatCard label="Aggregate Gross Profit" value={`₹${sm.gross_profit.toLocaleString("en-IN")}`} color={sm.gross_profit > 0 ? "green" : "red"} />
            <StatCard label="Overall Margin %" value={`${sm.gross_margin_percent.toFixed(1)}%`} color="indigo" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable columns={COLUMNS} rows={data?.trend || []} emptyMessage="No transactions on record for the selected date range" />
      </div>
    </ReportPageWrapper>
  );
};

export default PeriodPLReportPage;