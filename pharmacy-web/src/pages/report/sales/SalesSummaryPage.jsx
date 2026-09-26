// pharmacy-web/src/pages/report/sales/SalesSummaryPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/sales/SalesSummaryPage.jsx

import { useState, useEffect, useCallback } from "react";
import { BarChart2 } from "lucide-react";
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

const SalesSummaryPage = () => {
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
      const res = await reportsAPI.getSalesSummary(filters);
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

  const s = data?.summary;

  return (
    <ReportPageWrapper
      title="Sales Summary"
      subtitle="Overview of sales performance for the selected period"
      icon={BarChart2}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-100"
      isLoading={isLoading}
    >
      {/* Filters */}
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />
      </div>

      {/* Content */}
      {data && (
        <div className="flex-1 overflow-auto p-5 space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total Invoices"
              value={s.total_invoices}
              color="indigo"
            />
            <StatCard
              label="Gross Sales"
              value={`₹${s.gross_sales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="green"
            />
            <StatCard
              label="Net Sales (after returns)"
              value={`₹${s.net_sales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="blue"
            />
            <StatCard
              label="Total Collected"
              value={`₹${s.total_collected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="purple"
            />
            <StatCard
              label="Total Discount Given"
              value={`₹${s.total_discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="amber"
            />
            <StatCard
              label="CGST Collected"
              value={`₹${s.cgst_collected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="gray"
            />
            <StatCard
              label="SGST Collected"
              value={`₹${s.sgst_collected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="gray"
            />
            <StatCard
              label="Outstanding"
              value={`₹${s.total_outstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="red"
            />
          </div>

          {/* Returns row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              label="Returns Count"
              value={s.returns_count}
              color="amber"
            />
            <StatCard
              label="Returns Amount"
              value={`₹${s.returns_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="amber"
            />
            {data.comparison.growth_percent !== null && (
              <StatCard
                label="Growth vs Previous Period"
                value={`${data.comparison.growth_percent}%`}
                subValue={`Prev: ₹${(data.comparison.previous_period_sales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                color={
                  parseFloat(data.comparison.growth_percent) >= 0
                    ? "green"
                    : "red"
                }
              />
            )}
          </div>

          {/* Payment mode breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 mb-3">
              Payment Mode Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {data.payment_mode_breakdown.map((m) => (
                <div
                  key={m.mode}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5"
                >
                  <p className="text-[10px] font-semibold text-gray-500 uppercase">
                    {m.mode}
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    ₹{m.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-gray-400">{m.count} payments</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment status breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 mb-3">
              Invoice Payment Status
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {data.payment_status_breakdown.map((p) => {
                const color =
                  p.status === "PAID"
                    ? "green"
                    : p.status === "PARTIALLY_PAID"
                      ? "amber"
                      : "red";
                return (
                  <StatCard
                    key={p.status}
                    label={p.status.replace("_", " ")}
                    value={`₹${p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                    subValue={`${p.count} invoices`}
                    color={color}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </ReportPageWrapper>
  );
};

export default SalesSummaryPage;