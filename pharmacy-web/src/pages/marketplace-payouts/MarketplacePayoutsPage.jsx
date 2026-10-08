// pharmacy-web/src/pages/marketplace-payouts/MarketplacePayoutsPage.jsx (do not remove this comment)
// src/pages/marketplace-payouts/MarketplacePayoutsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  IndianRupee,
  Calendar,
  RefreshCw,
  Landmark,
  Percent,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getCurrentWeekPayout,
  getPayoutHistory,
  getPayoutDetail,
} from "../../api/marketplacePayouts";
import { getMyCommissionRate } from "../../api/marketplace";
import { useToast } from "../../components/common/Toast";
import BankingPendingBanner from "../../components/common/BankingPendingBanner";
import { useMarketplaceStore } from "../../store/useMarketplaceStore";
import { useAuthStore, selectIsSuperAdmin } from "../../store/useAuthStore";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function getDaysUntilMonday() {
  const today = new Date();
  const day = today.getDay();
  return day === 0 ? 1 : 8 - day;
}

const STATUS_BADGES = {
  DRAFT: "bg-white/[0.04] text-white/60 border border-white/[0.08]",
  PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  PROCESSING: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  FAILED: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

const MarketplacePayoutsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const banking = useMarketplaceStore((s) => s.banking);
  const isStatusLoaded = useMarketplaceStore((s) => s.isStatusLoaded);
  const isStatusLoading = useMarketplaceStore((s) => s.isStatusLoading);
  const loadStatus = useMarketplaceStore((s) => s.loadStatus);

  // Core data states
  const [currentWeek, setCurrentWeek] = useState(null);
  const [commissionRate, setCommissionRate] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Detail drawer states
  const [activePayoutDetail, setActivePayoutDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Global loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-load store status for banking alerts
  useEffect(() => {
    if (!isStatusLoaded && !isStatusLoading) {
      loadStatus();
    }
  }, [isStatusLoaded, isStatusLoading, loadStatus]);

  // Load live payout cycle, commission rule, and history
  const loadPageData = useCallback(
    async (pageNumber = 1) => {
      try {
        const [currRes, rateRes, histRes] = await Promise.all([
          getCurrentWeekPayout().catch(() => ({ success: false })),
          getMyCommissionRate().catch(() => ({ data: { success: false } })),
          getPayoutHistory({ page: pageNumber, limit: 10 }).catch(() => ({
            success: false,
          })),
        ]);

        if (currRes?.success) setCurrentWeek(currRes.data);
        if (rateRes?.data?.data) setCommissionRate(rateRes.data.data);
        if (histRes?.success) {
          setHistory(histRes.data.payouts || []);
          setPagination({
            page: histRes.data.pagination?.page || 1,
            limit: histRes.data.pagination?.limit || 10,
            total: histRes.data.pagination?.total || 0,
            totalPages: histRes.data.pagination?.totalPages || 1,
          });
        }
      } catch (err) {
        console.error("[Payouts] Load failure:", err);
        toast.error("Error", "Could not load settlement ledger");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadPageData(1);
  }, [loadPageData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadPageData(pagination.page);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    loadPageData(newPage);
  };

  // Open detail drawer for a specific payout ID
  const handleOpenDetail = async (payoutId) => {
    setIsDetailLoading(true);
    try {
      const res = await getPayoutDetail(payoutId);
      if (res?.success) {
        setActivePayoutDetail(res.data);
      }
    } catch (err) {
      toast.error("Error", err?.message || "Failed to load settlement details");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Export CSV for single week detail line items
  const handleExportDetailCSV = () => {
    if (!activePayoutDetail || !activePayoutDetail.order_line_items?.length)
      return;

    const headers = [
      "Order Number",
      "Subtotal (INR)",
      "Commission Rate",
      "Commission Deducted (INR)",
      "Pharmacy Earning (INR)",
      "Completed At",
    ];

    const rows = activePayoutDetail.order_line_items.map((item) => [
      item.order_number,
      item.subtotal,
      `${item.commission_rate_percent}%`,
      item.commission_amount,
      item.pharmacy_earning,
      item.completed_at
        ? new Date(item.completed_at).toLocaleString("en-IN")
        : "—",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Settlement_LineItems_${activePayoutDetail.week_start}_to_${activePayoutDetail.week_end}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const bankingPending = isSuperAdmin && !banking.bank_account_holder;

  if (isLoading) {
    return (
      <div className="h-screen bg-[#010015] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-indigo-400" />
        <p className="text-xs text-white/50 font-semibold tracking-wider uppercase">
          Loading Settlement Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#010015] overflow-hidden text-white">
      {/* ── Page Header ── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.08] bg-[#010015] z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center flex-shrink-0">
            <IndianRupee size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Payouts & Settlements
            </h1>
            <p className="text-[11px] text-white/50 mt-0.5">
              Review active accrual balances, weekly disbursement history, and
              bank deposit records
            </p>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw
            size={12}
            className={isRefreshing ? "animate-spin text-indigo-400" : ""}
          />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* ── Banking Alert Banner ── */}
      {bankingPending && (
        <div className="flex-shrink-0 px-6 pt-3">
          <BankingPendingBanner
            onAction={() => navigate("/marketplace/storefront")}
          />
        </div>
      )}

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {/* ── Section 1: Top Dual Cards (Live Week & Commission Rule) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
          {/* Hero Card: Current Accrual Period */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.03] p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                <Calendar size={10} /> Active Accrual Window
              </span>
              <span className="text-[11px] text-white/45 font-medium flex items-center gap-1.5">
                <Clock size={12} className="text-indigo-400" />
                Cycle settles in:{" "}
                <span className="text-indigo-300 font-bold">
                  {getDaysUntilMonday()} days
                </span>
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-5">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-semibold text-white/50 tracking-wider">
                  Estimated Net Disbursement
                </p>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-indigo-200 font-mono">
                  {fmt(currentWeek?.net_amount)}
                </p>
              </div>

              <div className="text-xs text-white/40 border-l border-white/[0.1] pl-5 space-y-1">
                <div>
                  Gross Medicine Sales:{" "}
                  <span className="text-white/85 font-semibold font-mono">
                    {fmt(currentWeek?.gross_amount)}
                  </span>
                </div>
                <div>
                  Commission Offset:{" "}
                  <span className="text-rose-400 font-semibold font-mono">
                    -{fmt(currentWeek?.commission_amount)}
                  </span>
                </div>
                <div>
                  Orders Billed:{" "}
                  <span className="text-white/80 font-semibold">
                    {currentWeek?.total_orders || 0} orders
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-white/40">
              <span>
                Cycle: <strong>{currentWeek?.week_start || "—"}</strong> →{" "}
                <strong>{currentWeek?.week_end || "—"}</strong>
              </span>
              <span className="text-indigo-300/80 font-medium">
                * Automatically finalized every Monday at 06:00 AM IST
              </span>
            </div>
          </div>

          {/* Card 2: Commission Rate Info */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.01] p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent size={14} className="text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                  Your Platform Commission
                </span>
              </div>
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                  commissionRate?.is_suspended
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {commissionRate?.is_suspended ? "WAIVED (0%)" : "ACTIVE"}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xl font-bold text-white tracking-tight">
                {commissionRate?.rate_description || "Standard Platform Rate"}
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                Applied to all completed medicine transactions. Settlement
                frequency is <strong className="text-white/70">weekly</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[10px] text-white/40 flex justify-between items-center">
              <span>
                Rate Source:{" "}
                <strong className="text-white/80 capitalize">
                  {commissionRate?.source || "Standard Default"}
                </strong>
              </span>
              <button
                onClick={() => navigate("/marketplace/reports?tab=earnings")}
                className="text-indigo-300 hover:text-indigo-200 font-semibold flex items-center gap-1"
              >
                View Analytics <ArrowRight size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 2: Settlement History & Bank Registers ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark size={14} className="text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">
                Disbursed Settlement Archives
              </h2>
            </div>
            <span className="text-[11px] text-white/40">
              Total Recorded Cycles:{" "}
              <strong className="text-white/80">{pagination.total}</strong>
            </span>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-white/60">
                    <th className="px-5 py-3.5">Settlement Window</th>
                    <th className="px-5 py-3.5 text-center">Orders</th>
                    <th className="px-5 py-3.5 text-right">Gross Sales</th>
                    <th className="px-5 py-3.5 text-right">Commission</th>
                    <th className="px-5 py-3.5 text-right">Net Disbursed</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Settled On</th>
                    <th className="px-5 py-3.5 text-center">UTR / Ref</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {history.length > 0 ? (
                    history.map((payout) => (
                      <tr
                        key={payout.payout_id}
                        className="hover:bg-white/[0.02] transition-colors duration-150"
                      >
                        <td className="px-5 py-4 font-medium text-white/90">
                          {payout.week_start}{" "}
                          <span className="text-white/30 mx-1">→</span>{" "}
                          {payout.week_end}
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-white/70">
                          {payout.total_orders || 0}
                        </td>
                        <td className="px-5 py-4 text-right text-white/70 font-mono">
                          {fmt(payout.gross_amount)}
                        </td>
                        <td className="px-5 py-4 text-right text-rose-400 font-mono">
                          -{fmt(payout.commission_amount)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-400 font-mono">
                          {fmt(payout.net_amount)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                              STATUS_BADGES[payout.status] ||
                              STATUS_BADGES.DRAFT
                            }`}
                          >
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center text-white/50">
                          {payout.payment_date || "—"}
                        </td>
                        <td className="px-5 py-4 text-center text-white/60 font-mono text-[11px]">
                          {payout.utr_reference || "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleOpenDetail(payout.payout_id)}
                            className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1.5 ml-auto"
                          >
                            <Eye size={12} className="text-indigo-400" />
                            <span>Receipt & Line Items</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-16 text-white/40"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Landmark size={28} className="text-white/20 mb-1" />
                          <p className="text-xs font-semibold text-white/60">
                            No settled records on file
                          </p>
                          <p className="text-[11px] text-white/30 max-w-sm">
                            Completed marketplace orders will accumulate here
                            once finalized into weekly disbursement cycles.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between py-3 px-5 border-t border-white/[0.08] bg-white/[0.02]">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs font-semibold hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-white/50 font-medium">
                  Page{" "}
                  <strong className="text-white/90">{pagination.page}</strong>{" "}
                  of <strong>{pagination.totalPages}</strong>
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs font-semibold hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Slide-over Detail Drawer: Bank Receipt & Order Line Items ── */}
      {activePayoutDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActivePayoutDetail(null)}
          />

          <div className="relative w-full max-w-xl h-full bg-[#0d0a2a] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#090726]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Settlement Breakdown Audit
                </h3>
                <p className="text-[10px] text-white/45 mt-0.5 font-mono">
                  Cycle: {activePayoutDetail.week_start} →{" "}
                  {activePayoutDetail.week_end}
                </p>
              </div>
              <button
                onClick={() => setActivePayoutDetail(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              {/* Financial Snapshot Card */}
              <div className="rounded-xl bg-indigo-500/[0.04] border border-indigo-500/20 p-4.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    Disbursement Reconciliation
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      STATUS_BADGES[activePayoutDetail.status] ||
                      STATUS_BADGES.DRAFT
                    }`}
                  >
                    {activePayoutDetail.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex justify-between text-white/60">
                    <span>Gross Medicine Volume</span>
                    <span className="font-semibold text-white/90 font-mono">
                      {fmt(activePayoutDetail.gross_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Commission Deducted</span>
                    <span className="font-semibold text-rose-400 font-mono">
                      -{fmt(activePayoutDetail.commission_amount)}
                    </span>
                  </div>
                  {activePayoutDetail.adjustments?.length > 0 && (
                    <div className="flex justify-between text-white/60">
                      <span>Adjustments Applied</span>
                      <span className="font-semibold text-cyan-400 font-mono">
                        {fmt(
                          activePayoutDetail.adjustments.reduce(
                            (s, a) =>
                              s +
                              (a.type === "ADDITION"
                                ? Number(a.amount)
                                : -Number(a.amount)),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  )}
                  <div className="h-[1px] bg-white/[0.08] my-1" />
                  <div className="flex justify-between text-sm font-extrabold text-emerald-400 pt-0.5">
                    <span>Final Net Deposited</span>
                    <span className="font-mono">
                      {fmt(activePayoutDetail.net_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Snapshot Information */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-4.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                  <Building2 size={12} className="text-indigo-400" />
                  <span>Beneficiary Bank Account Snapshot</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-white/40 block text-[10px]">
                      Account Holder
                    </span>
                    <span className="font-semibold text-white/90">
                      {activePayoutDetail.manual_bank_used ||
                        "Registered Primary Account"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px]">
                      Payment Date
                    </span>
                    <span className="font-semibold text-white/90">
                      {activePayoutDetail.payment_date || "Pending Dispatch"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-white/40 block text-[10px]">
                      UTR / Transfer Reference
                    </span>
                    <span className="font-mono text-indigo-300 font-semibold">
                      {activePayoutDetail.utr_reference ||
                        "Will generate upon bank confirmation"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Line Items Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                    Billed Orders (
                    {activePayoutDetail.order_line_items?.length || 0})
                  </span>
                  {activePayoutDetail.order_line_items?.length > 0 && (
                    <button
                      onClick={handleExportDetailCSV}
                      className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white text-[10px] font-semibold flex items-center gap-1"
                    >
                      <FileSpreadsheet size={10} className="text-emerald-400" />
                      Export CSV
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {activePayoutDetail.order_line_items?.length > 0 ? (
                    activePayoutDetail.order_line_items.map((item) => (
                      <div
                        key={item.id || item.order_id}
                        className="flex justify-between items-center p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs hover:border-white/[0.08] transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-white/90">
                            {item.order_number}
                          </p>
                          <p className="text-[10px] text-white/40">
                            Subtotal: {fmt(item.subtotal)} · Comm:{" "}
                            {item.commission_rate_percent}% (-
                            {fmt(item.commission_amount)})
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-emerald-400">
                            {fmt(item.pharmacy_earning)}
                          </p>
                          <p className="text-[9px] text-white/30">
                            {item.completed_at
                              ? new Date(item.completed_at).toLocaleDateString(
                                  "en-IN",
                                  { day: "numeric", month: "short" },
                                )
                              : "—"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/30 text-center py-6">
                      No order line item breakdowns recorded for this cycle.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] bg-[#090726]">
              <button
                onClick={() => setActivePayoutDetail(null)}
                className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-xs font-semibold text-white transition-colors"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePayoutsPage;
