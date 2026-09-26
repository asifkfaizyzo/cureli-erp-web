// pharmacy-web/src/pages/report/inventory/StockAdjustmentReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/inventory/StockAdjustmentReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Shield } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import ReportPagination from "../shared/ReportPagination";

const LIMIT = 50;

const defaultFilters = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: firstOfMonth.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    reasonType: "",
    branchId: "",
  };
};

const COLUMNS = [
  {
    key: "adjustment_date",
    label: "Date",
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
  { key: "medicine_name", label: "Medicine" },
  { key: "batch_number", label: "Batch", align: "center", width: "w-24" },
  { key: "old_quantity", label: "Old Stock", align: "center" },
  { key: "new_quantity", label: "New Stock", align: "center" },
  {
    key: "variance",
    label: "Variance",
    align: "center",
    render: (v) => {
      const isPositive = Number(v) > 0;
      return (
        <span className={`font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? `+${v}` : v}
        </span>
      );
    },
  },
  {
    key: "reason",
    label: "Adjustment Reason",
    render: (v, row) => (
      <div>
        <p className="font-semibold text-gray-800">{v?.replace(/_/g, " ")}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{row.reason_notes}</p>
      </div>
    ),
  },
  { key: "adjusted_by", label: "Adjusted By" },
  { key: "approved_by", label: "Authorized By" },
];

const EXPORT_COLUMNS = [
  { key: "adjustment_date", label: "Date" },
  { key: "medicine_name", label: "Medicine" },
  { key: "batch_number", label: "Batch" },
  { key: "old_quantity", label: "Old Quantity" },
  { key: "new_quantity", label: "New Quantity" },
  { key: "variance", label: "Variance" },
  { key: "reason", label: "Reason Class" },
  { key: "reason_notes", label: "Staff Description" },
  { key: "adjusted_by", label: "Adjusted By" },
  { key: "approved_by", label: "Authorized By" },
  { key: "branch_name", label: "Branch" },
];

const StockAdjustmentReportPage = () => {
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
      const res = await reportsAPI.getStockAdjustmentsReport({
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
      key: "reasonType",
      label: "Reason",
      type: "select",
      options: [
        { value: "PHYSICAL_COUNT_VARIANCE", label: "Physical Count Discrepancy" },
        { value: "DAMAGED_GOODS", label: "Damaged Stock" },
        { value: "EXPIRED_GOODS", label: "Expired Stock" },
        { value: "SYSTEM_CORRECTION", label: "System Correction" },
        { value: "THEFT_LOSS", label: "Loss / Theft" },
        { value: "OTHER", label: "Other" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  return (
    <ReportPageWrapper
      title="Stock Adjustment Log"
      subtitle="Full transparency audit trail of stock counts modified by hand"
      icon={Shield}
      iconColor="text-violet-600"
      iconBg="bg-violet-100"
      isLoading={isLoading}
      exportData={data?.records || []}
      exportFilename="manual_stock_adjustments_audit"
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
          emptyMessage="No adjustments on file during this selection range"
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

export default StockAdjustmentReportPage;