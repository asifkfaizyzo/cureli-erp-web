// pharmacy-web/src/pages/marketplace-reports/components/tabs/EarningsTrendTab.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/tabs/EarningsTrendTab.jsx

import React, { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, Landmark, Percent } from "lucide-react";
import {
  getCurrentWeekPayout,
  getEarningsSummary,
  getPayoutHistory,
} from "../../../../api/marketplacePayouts";
import { getMyCommissionRate } from "../../../../api/marketplace";
import { useToast } from "../../../../components/common/Toast";
import MarketplaceReportLayout from "../shared/MarketplaceReportLayout";
import MarketplaceStatCard from "../shared/MarketplaceStatCard";
import MarketplaceReportTable from "../shared/MarketplaceReportTable";
import DailyEarningsChart from "../../../marketplace-payouts/components/DailyEarningsChart";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_BADGES = {
  DRAFT: "bg-white/[0.04] text-white/60 border border-white/[0.08]",
  PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  PROCESSING: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  FAILED: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

const HISTORY_COLUMNS = [
  {
    key: "cycle",
    label: "Settlement Week",
    render: (_, r) => (
      <span className="font-medium text-white/90">
        {r.week_start} <span className="text-white/30 mx-1">→</span> {r.week_end}
      </span>
    ),
  },
  { key: "total_orders", label: "Orders", align: "center" },
  {
    key: "gross_amount",
    label: "Gross Sales",
    align: "right",
    render: (v) => fmt(v),
  },
  {
    key: "commission_amount",
    label: "Commission Deducted",
    align: "right",
    render: (v) => <span className="text-rose-400 font-mono">-{fmt(v)}</span>,
  },
  {
    key: "net_amount",
    label: "Net Disbursed",
    align: "right",
    render: (v) => <span className="font-bold text-emerald-400 font-mono">{fmt(v)}</span>,
  },
  {
    key: "status",
    label: "Status",
    align: "center",
    render: (v) => (
      <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_BADGES[v] || STATUS_BADGES.DRAFT}`}>
        {v}
      </span>
    ),
  },
  {
    key: "payment_date",
    label: "Settled On",
    align: "center",
    render: (v, r) => v || r.manual_payment_date || "—",
  },
];

const EXPORT_COLUMNS = [
  { key: "week_start", label: "Week Start" },
  { key: "week_end", label: "Week End" },
  { key: "total_orders", label: "Orders" },
  { key: "gross_amount", label: "Gross Sales" },
  { key: "commission_amount", label: "Commission" },
  { key: "net_amount", label: "Net Amount" },
  { key: "status", label: "Status" },
  { key: "payment_date", label: "Payment Date" },
];

const EarningsTrendTab = () => {
  const toast = useToast();
  const [currentWeek, setCurrentWeek] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [commRate, setCommRate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currRes, sumRes, histRes, rateRes] = await Promise.all([
        getCurrentWeekPayout().catch(() => null),
        getEarningsSummary().catch(() => null),
        getPayoutHistory({ limit: 50 }).catch(() => null),
        getMyCommissionRate().catch(() => null),
      ]);

      if (currRes?.success) setCurrentWeek(currRes.data);
      if (sumRes?.success) setSummary(sumRes.data);
      if (histRes?.success) setHistory(histRes.data?.payouts || []);
      if (rateRes?.data?.data) setCommRate(rateRes.data.data);
    } catch (err) {
      toast.error("Error", "Failed to retrieve earnings trends");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const l4w = summary?.last_4_weeks;

  return (
    <MarketplaceReportLayout
      title="Payouts & Earnings Trend"
      subtitle="Examine weekly disbursement cycles, commission deductions over time, and rolling settlement trends"
      icon={IndianRupee}
      exportData={history}
      exportFilename="marketplace_payout_history"
      exportColumns={EXPORT_COLUMNS}
      statCards={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MarketplaceStatCard
            label="Current Week Accrual"
            value={currentWeek ? fmt(currentWeek.net_amount) : "—"}
            subValue={`Cycle: ${currentWeek?.week_start || "—"} → ${currentWeek?.week_end || "—"}`}
            color="emerald"
            icon={TrendingUp}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="4-Week Rolling Net"
            value={l4w ? fmt(l4w.total_net) : "—"}
            subValue={l4w ? `Avg: ${fmt(l4w.total_net / 4)}/wk` : "—"}
            color="indigo"
            icon={Landmark}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Active Commission Rule"
            value={commRate ? commRate.rate_description : "Standard"}
            subValue={commRate?.is_suspended ? "Commission waived" : `Source: ${commRate?.source || "default"}`}
            color="purple"
            icon={Percent}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Pending Processing"
            value={l4w ? fmt(l4w.pending_amount) : "—"}
            subValue={`${l4w?.payout_count || 0} recent cycles`}
            color="amber"
            icon={IndianRupee}
            isLoading={isLoading}
          />
        </div>
      }
    >
      <div className="space-y-5">
        {/* Daily chart of the live week */}
        {currentWeek?.daily && <DailyEarningsChart dailyData={currentWeek.daily} />}

        {/* Historical Settled Register */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02] flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Settlement History & Disbursement Archives
            </h3>
            <span className="text-[10px] text-white/40">Weekly finalized periods</span>
          </div>
          <MarketplaceReportTable
            columns={HISTORY_COLUMNS}
            rows={history}
            isLoading={isLoading}
            emptyMessage="No past settlement records found"
          />
        </div>
      </div>
    </MarketplaceReportLayout>
  );
};

export default EarningsTrendTab;