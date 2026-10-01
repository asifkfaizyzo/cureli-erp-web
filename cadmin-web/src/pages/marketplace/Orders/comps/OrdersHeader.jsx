import { ShoppingBag, FileText, RefreshCw } from "lucide-react";

const OrdersHeader = ({
  viewMode,
  setViewMode,
  totalCount,
  loading,
  refreshing,
  onRefresh,
}) => {
  const isOrders = viewMode === "orders";

  return (
    <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isOrders ? "bg-[#05015A]" : "bg-teal-600"
          }`}
        >
          {isOrders ? (
            <ShoppingBag size={20} className="text-white" />
          ) : (
            <FileText size={20} className="text-white" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {isOrders ? "Marketplace Orders" : "Prescription Requests"}
          </h1>
          <p className="text-sm text-gray-500">
            {loading
              ? "Loading..."
              : `${totalCount.toLocaleString()} total ${isOrders ? "orders" : "requests"}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* ── Tab Toggle ── */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => setViewMode("orders")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isOrders
                ? "bg-white text-[#05015A] shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShoppingBag size={13} />
            Orders
          </button>
          <button
            onClick={() => setViewMode("prescriptions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              !isOrders
                ? "bg-white text-teal-700 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText size={13} />
            Prescriptions
          </button>
        </div>

        {/* ── Refresh ── */}
        <button
          onClick={onRefresh}
          disabled={refreshing || loading}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                     hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                     disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default OrdersHeader;