// cadmin-web/src/pages/marketplace/Orders/comps/OrdersHeader.jsx (do not remove this comment)
import { ShoppingBag, RefreshCw } from "lucide-react";

const OrdersHeader = ({ totalCount, loading, refreshing, onRefresh }) => {
  return (
    <div className="flex-shrink-0 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center flex-shrink-0">
          <ShoppingBag size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            Marketplace Orders
          </h1>
          <p className="text-sm text-gray-500">
            {loading ? "Loading orders..." : `${totalCount.toLocaleString()} total orders`}
          </p>
        </div>
      </div>

      <button
        onClick={onRefresh}
        disabled={refreshing || loading}
        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                   hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                   disabled:opacity-50 flex-shrink-0 text-sm font-medium"
      >
        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        Refresh
      </button>
    </div>
  );
};

export default OrdersHeader;