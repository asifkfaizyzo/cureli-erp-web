// pharmacy-web/src/pages/report/inventory/ExpiryReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/inventory/ExpiryReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
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
  expiryBucket: "",
  manufacturer: "",
  branchId: "",
});

const COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "batch_number", label: "Batch", align: "center" },
  {
    key: "expiry_date",
    label: "Expiry",
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
  { key: "current_stock", label: "Current Stock", align: "center" },
  {
    key: "mrp",
    label: "MRP",
    align: "right",
    render: (v) => `₹${Number(v).toFixed(2)}`,
  },
  {
    key: "value_at_risk",
    label: "Value At Risk",
    align: "right",
    render: (v) => (
      <span className="font-semibold text-gray-900">
        ₹{Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "bucket",
    label: "Attention Requirement",
    align: "center",
    render: (v) => {
      const config = {
        expired: { text: "EXPIRED", style: "bg-red-100 text-red-800 border-red-200" },
        within_30: { text: "URGENT (<30d)", style: "bg-orange-100 text-orange-800 border-orange-200" },
        "31_60": { text: "31-60 DAYS", style: "bg-amber-100 text-amber-800 border-amber-200" },
        "61_90": { text: "61-90 DAYS", style: "bg-yellow-100 text-yellow-800 border-yellow-200" },
        "91_180": { text: "91-180 DAYS", style: "bg-blue-100 text-blue-800 border-blue-200" },
        safe: { text: "SAFE (>180d)", style: "bg-green-100 text-green-800 border-green-200" },
      };
      const b = config[v] || config.safe;
      return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${b.style}`}>
          {b.text}
        </span>
      );
    },
  },
];

const EXPORT_COLUMNS = [
  { key: "medicine_name", label: "Medicine Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "batch_number", label: "Batch" },
  { key: "expiry_date", label: "Expiry Date" },
  { key: "current_stock", label: "Current Stock" },
  { key: "mrp", label: "MRP" },
  { key: "value_at_risk", label: "Value At Risk" },
  { key: "bucket", label: "Status Bucket" },
];

const ExpiryReportPage = () => {
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
      const res = await reportsAPI.getExpiryReport({
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
      key: "expiryBucket",
      label: "Expiry Bucket",
      type: "select",
      options: [
        { value: "expired", label: "Expired" },
        { value: "within_30", label: "Within 30 Days" },
        { value: "31_60", label: "31–60 Days" },
        { value: "61_90", label: "61–90 Days" },
        { value: "91_180", label: "91–180 Days" },
        { value: "safe", label: "Safe (>180 Days)" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  return (
    <ReportPageWrapper
      title="Expiry Report"
      subtitle="Assess risk profiles of stock expiring within short-term boundaries"
      icon={Clock}
      iconColor="text-red-600"
      iconBg="bg-red-100"
      isLoading={isLoading}
      exportData={data?.records || []}
      exportFilename="expiry_risk_report"
      exportColumns={EXPORT_COLUMNS}
    >
      {data?.buckets && (
        <div className="grid grid-cols-6 border-b border-gray-100 bg-gray-50/40 p-4 gap-3">
          {Object.entries(data.buckets).map(([key, item]) => {
            const colors = {
              expired: "text-red-700 bg-red-50 border-red-100",
              within_30: "text-orange-700 bg-orange-50 border-orange-100",
              "31_60": "text-amber-700 bg-amber-50 border-amber-100",
              "61_90": "text-yellow-700 bg-yellow-50 border-yellow-100",
              "91_180": "text-blue-700 bg-blue-50 border-blue-100",
              safe: "text-green-700 bg-green-50 border-green-100",
            };
            const labels = {
              expired: "Expired",
              within_30: "Urgent (<30d)",
              "31_60": "31-60d",
              "61_90": "61-90d",
              "91_180": "91-180d",
              safe: "Safe (>180d)",
            };
            return (
              <div key={key} className={`p-2.5 rounded-lg border text-center ${colors[key]}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                  {labels[key]}
                </p>
                <p className="text-sm font-black mt-1">
                  ₹{Number(item.value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[9px] opacity-75 mt-0.5">{item.count} items</p>
              </div>
            );
          })}
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
          emptyMessage="No items matching criteria found"
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

export default ExpiryReportPage;