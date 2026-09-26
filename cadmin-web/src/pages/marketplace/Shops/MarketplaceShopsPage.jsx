// cadmin-web/src/pages/marketplace/Shops/MarketplaceShopsPage.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/MarketplaceShopsPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Store,
  X,
  CheckCircle2,
  XCircle,
  Layers,
  Building2,
  Link2,
  Radio,
  MoreVertical,
} from "lucide-react";
import {
  getMarketplaceShops,
  getMarketplaceShopById,
} from "../../../api/cadminMarketplaceShops";
import ShopDetailView from "./ShopDetailView";

// ── Helpers ────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const avatarGradient = (name = "") => {
  const palette = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
  ];
  const idx = name.charCodeAt(0) % palette.length || 0;
  return palette[idx];
};

// ── Marketplace status badge ───────────────────────────────────
const MPBadge = ({ status }) => {
  const cfg = {
    NOT_STARTED: {
      label: "Not Started",
      dot: "bg-gray-400",
      cls: "bg-gray-50 text-gray-600",
    },
    DRAFT: {
      label: "Draft",
      dot: "bg-amber-500",
      cls: "bg-amber-50 text-amber-700",
    },
    LIVE: {
      label: "Live",
      dot: "bg-emerald-500",
      cls: "bg-emerald-50 text-emerald-700",
    },
    SUSPENDED: {
      label: "Suspended",
      dot: "bg-red-500",
      cls: "bg-red-50 text-red-700",
    },
  }[status] || {
    label: "—",
    dot: "bg-gray-400",
    cls: "bg-gray-50 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Stat card ──────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, tint }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200/60">
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}
    >
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

// ── Row skeleton ───────────────────────────────────────────────
const RowSkeleton = () => (
  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50">
    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
      <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
    </div>
    <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
  </div>
);

// ── Empty ──────────────────────────────────────────────────────
const EmptyState = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
      <Store size={28} className="text-gray-300" />
    </div>
    <p className="text-sm font-medium text-gray-600">
      {query ? `No shops found for "${query}"` : "No shops found"}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      {query ? "Try a different search term" : "Shops will appear here"}
    </p>
  </div>
);

// ── Status filter tabs ─────────────────────────────────────────
const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Blocked" },
];

const MP_TABS = [
  { key: "", label: "Any" },
  { key: "LIVE", label: "Live" },
  { key: "DRAFT", label: "Draft" },
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "SUSPENDED", label: "Suspended" },
];

// ── Main page ──────────────────────────────────────────────────
const MarketplaceShopsPage = () => {
  // List state
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mpFilter, setMpFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  // Detail state
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [shopDetail, setShopDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, mpFilter]);

  // ── Fetch list ──
  const fetchShops = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await getMarketplaceShops({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          status: statusFilter,
          marketplace_status: mpFilter,
        });
        const d = res.data?.data;
        setShops(d?.shops || []);
        setTotalPages(d?.total_pages || 1);
        setTotalCount(d?.total || 0);
      } catch {
        setShops([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, debouncedSearch, statusFilter, mpFilter]
  );

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // ── Fetch detail ──
  const fetchDetail = useCallback(async (shopId) => {
    setDetailLoading(true);
    setShopDetail(null);
    try {
      const res = await getMarketplaceShopById(shopId);
      setShopDetail(res.data?.data || null);
    } catch {
      setShopDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelectShop = (shop) => {
    setSelectedShopId(shop.shop_id);
    fetchDetail(shop.shop_id);
  };

  const handleBack = () => {
    setSelectedShopId(null);
    setShopDetail(null);
    fetchShops({ silent: true });
  };

  const handleRefreshDetail = () => {
    if (selectedShopId) fetchDetail(selectedShopId);
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const active = shops.filter((s) => s.is_active).length;
    const blocked = shops.filter((s) => !s.is_active).length;
    const live = shops.filter(
      (s) => s.marketplaceProfile?.marketplace_status === "LIVE"
    ).length;
    return { active, blocked, live };
  }, [shops]);

  // ── Detail view (full screen inside layout) ──
  if (selectedShopId) {
    return (
      <ShopDetailView
        shop={shopDetail}
        loading={detailLoading}
        onBack={handleBack}
        onRefresh={handleRefreshDetail}
      />
    );
  }

  // ── List view ──
  return (
    <div className="h-full flex flex-col bg-gray-50/80">
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Marketplace Shops
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage shops and their marketplace presence
            </p>
          </div>
          <button
            onClick={() => fetchShops({ silent: true })}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatCard
            icon={Store}
            label="Total Shops"
            value={totalCount.toLocaleString()}
            tint="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Active"
            value={stats.active}
            tint="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={XCircle}
            label="Blocked"
            value={stats.blocked}
            tint="bg-red-50 text-red-600"
          />
          <StatCard
            icon={Radio}
            label="Live on MP"
            value={stats.live}
            tint="bg-violet-50 text-violet-600"
          />
        </div>

        {/* Filters bar */}
        <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200/60 p-2">
          <div className="flex items-center gap-2">
            {/* Shop status tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    statusFilter === tab.key
                      ? "bg-white text-[#05015A] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Marketplace status tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <Layers size={13} className="ml-2 text-gray-400" />
              {MP_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMpFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    mpFilter === tab.key
                      ? "bg-white text-[#05015A] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search shop, city, GST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/30 focus:ring-2 focus:ring-[#05015A]/10 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LIST ═══ */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
          {/* Column hints */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">
            <span className="flex-1">Shop</span>
            <span className="w-36 hidden md:block">Location</span>
            <span className="w-28 hidden lg:block">Marketplace</span>
            <span className="w-20 hidden lg:block text-center">Branches</span>
            <span className="w-24">Status</span>
            <span className="w-6" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))
            ) : shops.length === 0 ? (
              <EmptyState query={debouncedSearch} />
            ) : (
              shops.map((shop) => {
                const initials =
                  shop.business_name
                    ?.split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?";

                const logoUrl = shop.marketplaceProfile?.logo_url;
                const blocked = !shop.is_active;
                const mpStatus =
                  shop.marketplaceProfile?.marketplace_status;

                return (
                  <button
                    key={shop.shop_id}
                    onClick={() => handleSelectShop(shop)}
                    className="w-full flex items-center gap-4 px-5 py-3 border-b border-gray-50 text-left transition-all group hover:bg-gray-50"
                  >
                    {/* Shop */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {logoUrl ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100">
                            <img
                              src={logoUrl}
                              alt={shop.business_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.parentElement.style.display =
                                  "none";
                                e.currentTarget.parentElement.nextSibling.style.display =
                                  "flex";
                              }}
                            />
                          </div>
                        ) : null}
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(
                            shop.business_name || "?"
                          )} items-center justify-center text-white text-xs font-bold ${
                            logoUrl ? "hidden" : "flex"
                          }`}
                        >
                          {initials}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            blocked ? "bg-red-500" : "bg-emerald-500"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {shop.business_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate md:hidden">
                          {shop.city || "—"}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate hidden md:block">
                          {shop.owner?.full_name || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="w-36 hidden md:block min-w-0">
                      <p className="text-xs text-gray-700 truncate">
                        {shop.city || "—"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {shop.state || "—"}
                      </p>
                    </div>

                    {/* Marketplace */}
                    <div className="w-28 hidden lg:block">
                      <MPBadge status={mpStatus} />
                    </div>

                    {/* Branches */}
                    <div className="w-20 hidden lg:flex justify-center">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <Building2 size={12} className="text-gray-400" />
                        {shop._count?.branches ?? 0}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-24">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                          blocked
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            blocked ? "bg-red-500" : "bg-emerald-500"
                          }`}
                        />
                        {blocked ? "Blocked" : "Active"}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="w-6 flex justify-center">
                      <MoreVertical
                        size={15}
                        className="text-gray-300 group-hover:text-gray-500 transition-colors"
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500">
                Page{" "}
                <span className="font-semibold text-gray-700">{page}</span>{" "}
                of {totalPages} · {totalCount.toLocaleString()} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceShopsPage;