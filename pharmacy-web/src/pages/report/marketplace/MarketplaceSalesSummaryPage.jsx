// pharmacy-web/src/pages/report/marketplace/MarketplaceSalesSummaryPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/marketplace/MarketplaceSalesSummaryPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { ShoppingBag } from "lucide-react";
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
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: firstOfMonth.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    status: "",
    paymentMethod: "",
    branchId: "",
  };
};

const BRANCH_COLUMNS = [
  { key: "branch_name", label: "Branch Name" },
  { key: "order_count", label: "Total Orders", align: "center" },
  {
    key: "revenue",
    label: "Total Revenue",
    align: "right",
    render: (v) => (
      <span className="font-semibold text-gray-900">
        ₹{Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
];

const STATUS_COLUMNS = [
  {
    key: "status",
    label: "Order Status",
    render: (v) => (
      <span className="font-medium text-gray-800">{v?.replace(/_/g, " ")}</span>
    ),
  },
  { key: "order_count", label: "Orders Count", align: "center" },
  {
    key: "revenue",
    label: "Revenue Value",
    align: "right",
    render: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "order_count", label: "Order Count" },
  { key: "revenue", label: "Revenue (₹)" },
];

const MarketplaceSalesSummaryPage = () => {
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
      const res = await reportsAPI.getMarketplaceSalesSummary(filters);
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

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => setFilters(defaultFilters());

  const filterConfig = [
    { key: "startDate", label: "From Date", type: "date" },
    { key: "endDate", label: "To Date", type: "date" },
    {
      key: "status",
      label: "Order Status",
      type: "select",
      options: [
        { value: "PLACED", label: "Placed" },
        { value: "ACCEPTED", label: "Accepted" },
        { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
        { value: "COMPLETED", label: "Completed" },
        { value: "REJECTED", label: "Rejected" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      type: "select",
      options: [
        { value: "COD", label: "Cash on Delivery (COD)" },
        { value: "ONLINE", label: "Online (Prepaid)" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  const sm = data?.summary;
  const comp = data?.comparison;

  return (
    <ReportPageWrapper
      title="Marketplace Sales Summary"
      subtitle="High-level overview of digital marketplace order volume and financial yields"
      icon={ShoppingBag}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-100"
      isLoading={isLoading}
      exportData={data?.branch_breakdown || []}
      exportFilename="marketplace_sales_summary"
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
            <StatCard label="Total Orders Placed" value={sm.total_orders} color="indigo" />
            <StatCard
              label="Total Gross Revenue"
              value={`₹${sm.total_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="green"
            />
            <StatCard
              label="Avg Order Value (AOV)"
              value={`₹${sm.average_order_value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="blue"
            />
            {comp?.growth_percent !== null && (
              <StatCard
                label="Growth vs Prior Period"
                value={`${comp.growth_percent}%`}
                subValue={`Prior Rev: ₹${(comp.previous_period_revenue || 0).toLocaleString("en-IN")}`}
                color={parseFloat(comp.growth_percent) >= 0 ? "green" : "red"}
              />
            )}
          </div>
        )}
      </div>

      {data && (
        <div className="flex-1 overflow-auto p-5 space-y-6 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branch-wise contribution */}
            <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Branch Revenue Contribution
                </h3>
              </div>
              <ReportTable
                columns={BRANCH_COLUMNS}
                rows={data.branch_breakdown || []}
                emptyMessage="No branch orders on record"
              />
            </div>

            {/* Status breakdown */}
            <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Orders by Pipeline Status
                </h3>
              </div>
              <ReportTable
                columns={STATUS_COLUMNS}
                rows={data.status_breakdown || []}
                emptyMessage="No status transitions recorded"
              />
            </div>
          </div>
        </div>
      )}
    </ReportPageWrapper>
  );
};

export default MarketplaceSalesSummaryPage;