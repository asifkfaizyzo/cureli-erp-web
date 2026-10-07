// pharmacy-web/src/pages/marketplace-payouts/MarketplacePayoutsPage.jsx (do not remove this comment)
import { useState, useEffect, useMemo } from "react";
import {
  IndianRupee,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Percent,
  AlertOctagon,
  RefreshCw,
  Search,
  Building,
  History,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  CalendarRange,
  ArrowLeft
} from "lucide-react";
import PayoutHistoryTable from "./components/PayoutHistoryTable";

const fmt = (n) =>
  `₹${(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function getDaysUntilMonday() {
  const today = new Date();
  const day = today.getDay();
  return day === 0 ? 1 : 8 - day;
}

const MarketplacePayoutsPage = () => {
  // Live week layout tracking
  const [livePayout, setLivePayout] = useState(null);
  
  // Dashboard focus layout (can represent the live payout OR any historic selected payout)
  const [dashboardFocus, setDashboardFocus] = useState({
    payoutId: "live", // "live" or specific payout_id
    title: "Active Accrual Period",
    weekStart: "",
    weekEnd: "",
    grossTotal: 0,
    commissionTotal: 0,
    netTotal: 0,
    totalOrders: 0,
    branches: [],
    daily: [],
    orders: []
  });

  const [summaryData, setSummaryData] = useState(null);
  const [history, setHistory] = useState([]);
  const [lostRevenue, setLostRevenue] = useState({ cancelled: 0, rejected: 0, amount: 0 });
  const [activePayoutDetail, setActivePayoutDetail] = useState(null);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");

  // Pagination states for History Table
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Core Data Retrieval
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Live cycle statistics
      const currRes = await fetch(`${import.meta.env.VITE_API_URL}/api/marketplace/payouts/current`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const currData = await currRes.json();
      if (currData.success) {
        setLivePayout(currData.data);
        
        // Default dashboard context is set to the live weekly ledger
        setDashboardFocus({
          payoutId: "live",
          title: "Active Accrual Period",
          weekStart: currData.data.week_start,
          weekEnd: currData.data.week_end,
          grossTotal: currData.data.gross_total,
          commissionTotal: currData.data.commission_total,
          netTotal: currData.data.net_total,
          totalOrders: currData.data.total_orders,
          branches: currData.data.branches || [],
          daily: currData.data.daily || [],
          orders: currData.data.orders || []
        });
      }

      // 2. rolling 4-week window summaries
      const sumRes = await fetch(`${import.meta.env.VITE_API_URL}/api/marketplace/payouts/summary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const sumData = await sumRes.json();
      if (sumData.success) {
        setSummaryData(sumData.data);
      }

      // 3. Potential Lost Sales (Cancellations/Rejections audit)
      const lostRes = await fetch(`${import.meta.env.VITE_API_URL}/api/marketplace/orders?status=CANCELLED&limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const lostData = await lostRes.json();

      const rejRes = await fetch(`${import.meta.env.VITE_API_URL}/api/marketplace/orders?status=REJECTED&limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const rejData = await rejRes.json();

      let cancelTotal = 0;
      let rejectTotal = 0;
      if (lostData.success) {
        cancelTotal = lostData.data.orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
      }
      if (rejData.success) {
        rejectTotal = rejData.data.orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
      }

      setLostRevenue({
        cancelled: lostData.data?.total || 0,
        rejected: rejData.data?.total || 0,
        amount: cancelTotal + rejectTotal
      });

      // 4. Fetch the initial page of past settlements
      fetchHistoryList(1);

    } catch (error) {
      console.error("Failed executing core ledger data fetch", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoryList = async (pageNumber) => {
    setHistoryLoading(true);
    try {
      const histRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/marketplace/payouts/history?page=${pageNumber}&limit=5`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const histData = await histRes.json();
      if (histData.success) {
        setHistory(histData.data.payouts || []);
        setHistoryPage(histData.data.pagination?.page || 1);
        setHistoryTotalPages(histData.data.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error("Failed fetching past settlements", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Switches context of the main charts & tables back to current live accruals
  const handleResetToLiveContext = () => {
    if (!livePayout) return;
    setDashboardFocus({
      payoutId: "live",
      title: "Active Accrual Period",
      weekStart: livePayout.week_start,
      weekEnd: livePayout.week_end,
      grossTotal: livePayout.gross_total,
      commissionTotal: livePayout.commission_total,
      netTotal: livePayout.net_total,
      totalOrders: livePayout.total_orders,
      branches: livePayout.branches || [],
      daily: livePayout.daily || [],
      orders: livePayout.orders || []
    });
    // Scroll view back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Switch Dashboard Context to analyze a selected historical week
  const handleLoadHistoricalContext = async (payout) => {
    setIsRefreshing(true);
    try {
      const detailRes = await fetch(`${import.meta.env.VITE_API_URL}/api/marketplace/payouts/${payout.payout_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const detailData = await detailRes.json();
      if (detailData.success) {
        const fullAudit = detailData.data;
        
        // Safe breakdown fallback from structural snapshot
        const snapshot = fullAudit.payout?.breakdown_snapshot || {};
        
        setDashboardFocus({
          payoutId: payout.payout_id,
          title: `Settled Cycle Window`,
          weekStart: payout.week_start,
          weekEnd: payout.week_end,
          grossTotal: Number(payout.gross_amount),
          commissionTotal: Number(payout.commission_amount),
          netTotal: Number(payout.net_amount),
          totalOrders: payout.total_orders || snapshot.total_orders || fullAudit.order_line_items?.length || 0,
          branches: snapshot.branches || [],
          daily: snapshot.daily || [],
          orders: fullAudit.order_line_items?.map(o => ({
            order_id: o.order_id,
            order_number: o.order_number,
            branch_id: o.branch_id,
            branch_name: o.branch_name || "Primary Pharmacy",
            subtotal: Number(o.subtotal),
            rate: Number(o.commission_rate_percent),
            commission: Number(o.commission_amount),
            earning: Number(o.pharmacy_earning),
            source: "snapshot",
            completed_at: o.completed_at
          })) || []
        });

        // Smooth scroll focus back to dashboard elements
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      console.error("Error context-switching dashboard view", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectPayoutDetail = async (payoutId) => {
    try {
      const detailRes = await fetch(`${import.meta.env.VITE_API_URL}/api/marketplace/payouts/${payoutId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const detailData = await detailRes.json();
      if (detailData.success) {
        setActivePayoutDetail(detailData.data);
      }
    } catch (e) {
      console.error("Error loading detailed bank ledger snapshot drawer", e);
    }
  };

  // CSV Exporter for audited data lists
  const handleExportCSV = () => {
    const ordersToExport = filteredOrderItems;
    if (ordersToExport.length === 0) return;

    const headers = ["Order Number", "Branch ID", "Gross Subtotal", "Commission Rate", "Commission Offset", "Net Pay", "Completed At"];
    const rows = ordersToExport.map(o => [
      o.order_number,
      o.branch_id,
      o.subtotal,
      `${o.rate}%`,
      o.commission,
      o.earning,
      o.completed_at ? new Date(o.completed_at).toISOString() : "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Settlement_Audit_Week_${dashboardFocus.weekStart}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (newPage) => {
    setHistoryPage(newPage);
    fetchHistoryList(newPage);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Filter items in context switch 
  const filteredOrderItems = useMemo(() => {
    if (!dashboardFocus.orders) return [];
    return dashboardFocus.orders.filter((order) => {
      const matchesSearch = order.order_number?.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesBranch = selectedBranchFilter === "all" || order.branch_id === selectedBranchFilter;
      return matchesSearch && matchesBranch;
    });
  }, [dashboardFocus.orders, orderSearch, selectedBranchFilter]);

  const maxDailyGross = useMemo(() => {
    if (!dashboardFocus.daily || dashboardFocus.daily.length === 0) return 1;
    return Math.max(...dashboardFocus.daily.map((d) => d.subtotal || 1));
  }, [dashboardFocus.daily]);

  if (isLoading) {
    return (
      <div className="h-screen bg-[#010015] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-xs text-white/50 font-semibold tracking-wider uppercase">Loading Earnings Dashboard...</p>
      </div>
    );
  }

  const isLiveContext = dashboardFocus.payoutId === "live";

  return (
    <div className="h-screen flex flex-col bg-[#010015] overflow-hidden text-white">
      
      {/* ── Context Switch Banner Alert ── */}
      {!isLiveContext && (
        <div className="flex-shrink-0 bg-indigo-500/10 border-b border-indigo-400/20 px-6 py-2 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <CalendarRange size={13} className="text-indigo-400" />
            <span>
              Currently viewing archive data for week <strong>{dashboardFocus.weekStart} → {dashboardFocus.weekEnd}</strong>. Charts and audit details below represent historic finalized snapshots.
            </span>
          </div>
          <button
            onClick={handleResetToLiveContext}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-400/25 hover:bg-indigo-400/35 border border-indigo-400/30 text-white font-bold transition-all text-[10px]"
          >
            <ArrowLeft size={10} /> Back to Live Cycle
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.08] bg-[#010015] z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center flex-shrink-0">
            <IndianRupee size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Payouts & Earnings</h1>
            <p className="text-[11px] text-white/50 mt-0.5">
              Analyze settlement windows, commission offsets, and audit active branch pools
            </p>
          </div>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin text-indigo-400" : ""} />
          Sync Live Ledger
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        
        {/* ── TOP HERO BANNER: Current Focus Settlement View ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col justify-between ${
            isLiveContext 
              ? "border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.04]"
              : "border-amber-500/20 bg-gradient-to-br from-amber-500/[0.05] to-indigo-500/[0.02]"
          }`}>
            <div className="flex justify-between items-start">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                isLiveContext 
                  ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
              }`}>
                <Calendar size={10} /> {dashboardFocus.title}
              </span>
              {isLiveContext ? (
                <span className="text-[11px] text-white/45 font-medium">
                  Cycle ends in: <span className="text-indigo-300 font-bold">{getDaysUntilMonday()} days</span>
                </span>
              ) : (
                <button
                  onClick={handleResetToLiveContext}
                  className="text-[11px] text-amber-300 font-bold hover:underline flex items-center gap-1"
                >
                  <ArrowLeft size={10} /> View Current Active Week
                </button>
              )}
            </div>

            <div className="mt-5 flex items-baseline gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-semibold text-white/50 tracking-wider">
                  {isLiveContext ? "Estimated Next Settlement" : "Archive Settled Net"}
                </p>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-indigo-200">
                  {fmt(dashboardFocus.netTotal)}
                </p>
              </div>
              <div className="text-xs text-white/40 border-l border-white/[0.1] pl-4 space-y-1">
                <div>Gross Sales: <span className="text-white/85 font-semibold">{fmt(dashboardFocus.grossTotal)}</span></div>
                <div>Commissions Paid: <span className="text-rose-400 font-semibold">-{fmt(dashboardFocus.commissionTotal)}</span></div>
              </div>
            </div>

            <p className="text-[10px] text-white/40 mt-5 leading-relaxed">
              * Cycle data represents transaction logs mapped between <strong>{dashboardFocus.weekStart || "—"}</strong> and <strong>{dashboardFocus.weekEnd || "—"}</strong>.
            </p>
          </div>

          {/* Rolling context box (always holds summaries) */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.01] p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">4-Week Historical Window</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-white/40 font-bold">AVG Net Settlement</p>
                <p className="text-base font-extrabold text-emerald-400 mt-1">
                  {summaryData?.last_4_weeks?.net_total 
                    ? fmt(summaryData.last_4_weeks.net_total / 4)
                    : "₹0.00"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-white/40 font-bold">Total Orders Settled</p>
                <p className="text-base font-extrabold text-indigo-300 mt-1">
                  {summaryData?.last_4_weeks?.total_orders || "0"}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-white/45 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
              Average Commission Rate: <span className="text-indigo-300 font-bold">
                {summaryData?.last_4_weeks?.commission_total && summaryData?.last_4_weeks?.gross_total
                  ? ((summaryData.last_4_weeks.commission_total / summaryData.last_4_weeks.gross_total) * 100).toFixed(1)
                  : "0.0"}%
              </span>.
            </div>
          </div>
        </div>

        {/* ── THREE COLUMN ANALYTICS ROW ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Panel 1: Commission Details */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-4.5 space-y-3">
            <div className="flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5">
                <Percent size={13} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Effective Commission</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-400/15">
                {dashboardFocus.grossTotal > 0 ? ((dashboardFocus.commissionTotal / dashboardFocus.grossTotal) * 100).toFixed(1) : "0.0"}% Average
              </span>
            </div>
            
            <div className="pt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Marketplace Sales</span>
                <span className="font-semibold">{fmt(dashboardFocus.grossTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Commission Deduction</span>
                <span className="font-semibold text-rose-400">-{fmt(dashboardFocus.commissionTotal)}</span>
              </div>
              <div className="h-[1px] bg-white/[0.06] pt-1" />
              <div className="flex justify-between text-xs font-bold pt-1 text-emerald-400">
                <span>Net Earnings</span>
                <span>{fmt(dashboardFocus.netTotal)}</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Lost revenue calculator */}
          <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] p-4.5 space-y-3">
            <div className="flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5">
                <AlertOctagon size={13} className="text-rose-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Revenue Leaks</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Cancel / Reject
              </span>
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Rejected by Shop</span>
                <span className="font-semibold text-white/90">{lostRevenue.rejected} orders</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Cancelled by Customer</span>
                <span className="font-semibold text-white/90">{lostRevenue.cancelled} orders</span>
              </div>
              <div className="h-[1px] bg-white/[0.06] pt-1" />
              <div className="flex justify-between text-xs font-bold pt-1 text-rose-400">
                <span>Lost Revenue Potential</span>
                <span>{fmt(lostRevenue.amount)}</span>
              </div>
            </div>
          </div>

          {/* Panel 3: Branch Breakdown */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-4.5 space-y-3">
            <div className="flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5">
                <Building size={13} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Branch Performance</span>
              </div>
              <span className="text-[9px] text-white/40">Filtered Week</span>
            </div>

            <div className="pt-1 overflow-y-auto max-h-[85px] space-y-2 scrollbar-none">
              {dashboardFocus.branches?.length > 0 ? (
                dashboardFocus.branches.map((b) => (
                  <div key={b.branch_id || b.branch_name} className="flex justify-between items-center text-xs">
                    <span className="text-white/60 truncate max-w-[130px]">{b.branch_name}</span>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="text-[10px] text-white/40">({b.orders} orders)</span>
                      <span>{fmt(b.net)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-white/30 text-center py-4">No branch records for this block</div>
              )}
            </div>
          </div>
        </div>

        {/* ── DAILY ACCRUALS CHART ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-5">
          <div className="flex items-center gap-1.5 mb-5 justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">Daily Gross / Net Accrual Chart</span>
            </div>
            <span className="text-[10px] text-white/40">Cycle Days (Monday → Sunday)</span>
          </div>

          <div className="grid grid-cols-7 gap-3 h-28 items-end border-b border-white/[0.08] pb-1">
            {dashboardFocus.daily?.map((day) => {
              const heightPct = Math.max(4, Math.min(100, (day.subtotal / maxDailyGross) * 100));
              return (
                <div key={day.date || day.day_name} className="flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                  <div className="w-full relative rounded-t bg-white/[0.02] border-x border-t border-white/[0.05] h-full flex items-end justify-center">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-4 rounded-t bg-gradient-to-t from-indigo-500/30 to-indigo-400/70 group-hover:to-indigo-300 group-hover:from-indigo-400/40 transition-all duration-150"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 gap-3 pt-3">
            {dashboardFocus.daily?.map((day) => (
              <div key={day.date || day.day_name} className="text-center">
                <p className="text-[11px] font-semibold text-white/80">{day.day_name}</p>
                <p className="text-[9px] text-white/40 mt-0.5">{fmt(day.subtotal)}</p>
                <p className="text-[9px] font-bold text-indigo-400 mt-0.5">({day.orders})</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── AUDIT LINE ITEM SUBTABLE ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/[0.01]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Audit Ledger Line-Items</h3>
              <p className="text-[10px] text-white/40 mt-0.5">Audit every transaction mapped to this week's settlement block</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Audit Order Num..."
                  className="w-full pl-7 pr-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-md text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/40"
                />
              </div>

              {/* Branch Filter */}
              {dashboardFocus.branches?.length > 1 && (
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  className="bg-[#010015] border border-white/[0.08] text-[11px] rounded-md py-1 px-2 text-white/70 focus:outline-none"
                >
                  <option value="all">All Branches</option>
                  {dashboardFocus.branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                  ))}
                </select>
              )}

              {/* CSV Exporter */}
              {filteredOrderItems.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-1.5 text-[11px] font-semibold"
                >
                  <FileSpreadsheet size={11} className="text-emerald-400" />
                  Export Sheet
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-white/50">
                  <th className="px-5 py-2.5">Order Number</th>
                  <th className="px-5 py-2.5">Branch</th>
                  <th className="px-5 py-2.5 text-right">Subtotal</th>
                  <th className="px-5 py-2.5 text-center">Comm. Rate</th>
                  <th className="px-5 py-2.5 text-right">Commission Amt</th>
                  <th className="px-5 py-2.5 text-right">Your Net</th>
                  <th className="px-5 py-2.5 text-center">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[11px]">
                {filteredOrderItems.length > 0 ? (
                  filteredOrderItems.map((order) => (
                    <tr key={order.order_id || order.order_number} className="hover:bg-white/[0.01]">
                      <td className="px-5 py-3 font-semibold text-white/80">{order.order_number}</td>
                      <td className="px-5 py-3 text-white/50">{order.branch_name}</td>
                      <td className="px-5 py-3 text-right text-white/80">{fmt(order.subtotal)}</td>
                      <td className="px-5 py-3 text-center text-indigo-300 font-mono">
                        {order.rate}%
                        <span className="text-[9px] text-white/30 ml-1">({order.source})</span>
                      </td>
                      <td className="px-5 py-3 text-right text-rose-400 font-mono">-{fmt(order.commission)}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-400 font-mono">{fmt(order.earning)}</td>
                      <td className="px-5 py-3 text-center text-white/40">
                        {order.completed_at ? new Date(order.completed_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-white/30 py-8">
                      No order logs mapped to these dashboard filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SETTLED RECORDS HISTORICAL PAGINATED REGISTRY ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <History size={14} className="text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">DISBURSED SETTLEMENT ARCHIVES</h2>
          </div>
          
          <PayoutHistoryTable
            history={history}
            loading={historyLoading}
            onSelectPayout={handleSelectPayoutDetail}
            onLoadDashboardContext={handleLoadHistoricalContext}
            page={historyPage}
            totalPages={historyTotalPages}
            onPageChange={handlePageChange}
            activeContextId={dashboardFocus.payoutId}
          />
        </div>

      </div>

      {/* ── DETAILED HISTORICAL BANK LEDGER DRAWER ── */}
      {activePayoutDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivePayoutDetail(null)} />
          
          <div className="relative w-full max-w-lg h-full bg-[#0d0a3a] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.08] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Disbursement Summary Audit</h3>
                <p className="text-[10px] text-white/45 mt-0.5">ID: {activePayoutDetail.payout?.payout_id}</p>
              </div>
              <button
                onClick={() => setActivePayoutDetail(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
              >
                Close Audit
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              {/* Card Meta */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4.5 space-y-3">
                <div className="flex justify-between items-center text-xs text-white/40">
                  <span>Cycle Start/End</span>
                  <span className="font-semibold text-white/80">{activePayoutDetail.week_start} → {activePayoutDetail.week_end}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/40">
                  <span>Settlement Status</span>
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {activePayoutDetail.payout?.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/40">
                  <span>Finalized At</span>
                  <span className="font-semibold text-white/80">{activePayoutDetail.payout?.finalized_at || "—"}</span>
                </div>
              </div>

              {/* Bank Snapshot Information */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4.5 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Disbursement Bank Snapshot</h4>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Account Number</span>
                  <span className="font-mono text-white/90">{activePayoutDetail.shop?.bank_details?.account_number || "—"}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>IFSC Route Code</span>
                  <span className="font-mono text-white/90">{activePayoutDetail.shop?.bank_details?.ifsc || "—"}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Holder Name</span>
                  <span className="text-white/90">{activePayoutDetail.shop?.bank_details?.holder_name || "—"}</span>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/15 p-4.5 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/80 mb-1">Settlement Disbursed Total</h4>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Total Gross Sales Accrued</span>
                  <span className="text-white/85">{fmt(activePayoutDetail.payout?.gross_amount)}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Rule Deductions Paid</span>
                  <span className="text-rose-400">-{fmt(activePayoutDetail.payout?.commission_amount)}</span>
                </div>
                {activePayoutDetail.payout?.adjustments?.length > 0 && (
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Prior Rolling Adjustments</span>
                    <span className="text-indigo-400">-{fmt(activePayoutDetail.payout?.adjustments_total)}</span>
                  </div>
                )}
                <div className="h-[1px] bg-white/[0.08] my-1" />
                <div className="flex justify-between text-sm font-extrabold text-emerald-400">
                  <span>Final Disbursed Net</span>
                  <span>{fmt(activePayoutDetail.payout?.net_amount)}</span>
                </div>
              </div>

              {/* Order snapshots */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50">Settlement Line items</h4>
                <div className="space-y-1.5">
                  {activePayoutDetail.order_line_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded bg-white/[0.02]">
                      <span className="font-semibold text-white/80">{item.order_number}</span>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{fmt(item.pharmacy_earning)}</p>
                        <p className="text-[9px] text-white/30">Sub: {fmt(item.subtotal)} | Comm: {fmt(item.commission_amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.08] bg-[#090729]">
              <button
                onClick={() => setActivePayoutDetail(null)}
                className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-xs font-semibold"
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