// pharmacy-web/src/pages/report/marketplace/OrderStatusFunnelPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/marketplace/OrderStatusFunnelPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Filter } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import StatCard from "../shared/StatCard";

const defaultFilters = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: firstOfMonth.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    branchId: "",
  };
};

const STAGE_CONFIG = {
  PLACED: { label: "1. Placed", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  ACCEPTED: { label: "2. Accepted", color: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50" },
  READY_FOR_PICKUP: { label: "3. Ready For Pickup", color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
  COMPLETED: { label: "4. Completed (Fulfilled)", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  REJECTED: { label: "Rejected Drop-off", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
  CANCELLED: { label: "Cancelled Drop-off", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
};

const OrderStatusFunnelPage = () => {
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
      const res = await reportsAPI.getOrderStatusFunnel(filters);
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
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  return (
    <ReportPageWrapper
      title="Order Status Funnel"
      subtitle="Analyze conversion drop-offs across fulfillment pipeline stages"
      icon={Filter}
      iconColor="text-purple-600"
      iconBg="bg-purple-100"
      isLoading={isLoading}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />
      </div>

      {data && (
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Funnel Inflow" value={data.total_orders} color="indigo" />
            <StatCard
              label="Successful Completion Rate"
              value={`${data.funnel?.find((s) => s.status === "COMPLETED")?.percentage || 0}%`}
              color="green"
            />
            <StatCard
              label="Rejection Rate"
              value={`${data.funnel?.find((s) => s.status === "REJECTED")?.percentage || 0}%`}
              color="red"
            />
            <StatCard
              label="Cancellation Rate"
              value={`${data.funnel?.find((s) => s.status === "CANCELLED")?.percentage || 0}%`}
              color="amber"
            />
          </div>

          {/* Main Visual Funnel */}
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/30">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
              Consolidated Pipeline Volume
            </h3>
            <div className="space-y-3">
              {data.funnel.map((item) => {
                const conf = STAGE_CONFIG[item.status] || {
                  label: item.status,
                  color: "bg-gray-400",
                  text: "text-gray-700",
                  bg: "bg-gray-50",
                };
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-gray-700">{conf.label}</span>
                      <span className={`${conf.text} font-bold`}>
                        {item.count} orders ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${conf.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(item.percentage, 1.5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branch-wise breakdown */}
          {data.branch_breakdown?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                Branch-Specific Pipeline Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.branch_breakdown.map((b) => (
                  <div key={b.branch_id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                      <span className="text-xs font-bold text-gray-900">{b.branch_name}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {b.total_orders} total orders
                      </span>
                    </div>
                    <div className="space-y-2">
                      {b.stages.map((stage) => {
                        const conf = STAGE_CONFIG[stage.status];
                        return (
                          <div key={stage.status} className="text-xs flex justify-between items-center">
                            <span className="text-gray-500 text-[11px]">{conf?.label || stage.status}</span>
                            <span className="font-semibold text-gray-800">
                              {stage.count} ({stage.percentage}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ReportPageWrapper>
  );
};

export default OrderStatusFunnelPage;