// cadmin-web/src/pages/marketplace/Orders/comps/OrdersHeader.jsx (do not remove this comment)
import {
  LayoutGrid,
  Bike,
  Store,
  Truck,
  FileText,
  RefreshCw,
} from "lucide-react";

const ORDER_TABS = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "instant", label: "Instant", icon: Bike },
  { key: "pickup", label: "Pickup", icon: Store },
  { key: "sameday", label: "Same Day", icon: Truck },
];

const RX_TABS = [{ key: "prescriptions", label: "Prescriptions", icon: FileText }];

const TITLE_MAP = {
  all: "All Marketplace Orders",
  instant: "Instant Delivery Orders",
  pickup: "Pickup Orders",
  sameday: "Same Day Delivery",
  prescriptions: "Prescription Requests",
};

const ALL_TABS = [...ORDER_TABS, ...RX_TABS];

const OrdersHeader = ({
  viewMode,
  setViewMode,
  totalCount,
  loading,
  refreshing,
  onRefresh,
}) => {
  const activeTab = ALL_TABS.find((t) => t.key === viewMode) || ALL_TABS[0];
  const ActiveIcon = activeTab.icon;
  const isSameDay = viewMode === "sameday";
  const isPrescriptions = viewMode === "prescriptions";
  const countLabel = isPrescriptions ? "requests" : "orders";

  const renderTabButton = (tab, { isRx = false } = {}) => {
    const isActive = viewMode === tab.key;
    const Icon = tab.icon;

    // Prescription tab gets a distinct teal accent to signal it's a
    // different entity (requests, not orders).
    const activeCls = isRx
      ? "bg-white text-teal-700 shadow-sm border border-teal-200"
      : "bg-white text-[#05015A] shadow-sm border border-gray-200";
    const inactiveCls = isRx
      ? "text-teal-600/70 hover:text-teal-700"
      : "text-gray-500 hover:text-[#05015A]";

    return (
      <button
        key={tab.key}
        onClick={() => setViewMode(tab.key)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          isActive ? activeCls : inactiveCls
        }`}
      >
        <Icon size={13} />
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    );
  };

  return (
    <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
            isPrescriptions ? "bg-teal-600" : "bg-[#05015A]"
          }`}
        >
          <ActiveIcon size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {TITLE_MAP[viewMode] || "Marketplace Orders"}
          </h1>
          <p className="text-sm text-gray-500">
            {loading
              ? "Loading..."
              : isSameDay
                ? "Manage unassigned orders and active delivery batches"
                : `${totalCount.toLocaleString()} total ${countLabel}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* ── Grouped Tab Toggle ──
            Left group: Order fulfillment types (All, Instant, Pickup, Same Day)
            Right group: Prescription Requests (visually distinct — different entity type)
        */}
        <div className="flex items-center gap-2">
          {/* Orders group */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
            {ORDER_TABS.map((tab) => renderTabButton(tab))}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Prescriptions group — teal theme to signal "request" (not order) */}
          <div className="flex bg-teal-50 rounded-lg p-0.5 border border-teal-200">
            {RX_TABS.map((tab) => renderTabButton(tab, { isRx: true }))}
          </div>
        </div>

        {/* ── Refresh — shown for ALL tabs including Same Day ── */}
        <button
          onClick={onRefresh}
          disabled={refreshing || loading}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                     hover:bg-gray-50 hover:border-[#05015A]/30 hover:text-[#05015A]
                     transition-all shadow-sm flex items-center gap-2
                     disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default OrdersHeader;