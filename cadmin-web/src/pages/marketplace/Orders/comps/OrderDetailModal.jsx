// cadmin-web/src/pages/marketplace/Orders/comps/OrderDetailModal.jsx (do not remove this comment)
import { useState, useEffect, useCallback } from "react";
import { X, Receipt, Loader2, AlertCircle } from "lucide-react";
import { getMarketplaceOrderById } from "../../../../api/cadminMarketplaceOrders";
import useMarketplaceSSE from "./hooks/useMarketplaceSSE";
import OverviewTab from "./tabs/OverviewTab";
import ItemsTab from "./tabs/ItemsTab";
import DeliveryTab from "./tabs/DeliveryTab";
import StatusTab from "./tabs/StatusTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "items", label: "Items & Billing" },
  { key: "delivery", label: "Delivery Tracking" },
  { key: "status", label: "Status & Payment" },
];

const OrderDetailModal = ({ orderId, onClose, onStatusUpdated }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadOrder = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getMarketplaceOrderById(orderId)
      .then((res) => {
        if (active) setOrder(res.data?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load order details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    setActiveTab("overview");
  }, [orderId]);

  // ── SSE: Auto-refresh on matching order events (no debounce) ──
  const handleSSEStatusChanged = useCallback(
    (payload) => {
      if (payload?.order_id === orderId) loadOrder();
    },
    [orderId, loadOrder]
  );

  const handleSSEDeliveryChanged = useCallback(
    (payload) => {
      if (payload?.order_id === orderId) loadOrder();
    },
    [orderId, loadOrder]
  );

  useMarketplaceSSE({
    onStatusChanged: handleSSEStatusChanged,
    onDeliveryChanged: handleSSEDeliveryChanged,
    debounceMs: 300,
  });

  // ── Escape key ──
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleUpdated = () => {
    loadOrder();
    onStatusUpdated();
  };

  const statusCfg = {
    PLACED: "bg-amber-50 text-amber-700 border-amber-200",
    ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
    READY_FOR_PICKUP: "bg-violet-50 text-violet-700 border-violet-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
              <Receipt size={18} className="text-[#05015A]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {order ? `Order ${order.order_number}` : "Order Details"}
              </h2>
              {order && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Placed {new Date(order.placed_at).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit", hour12: true,
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {order && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg[order.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                {order.status?.replace(/_/g, " ")}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.key ? "text-[#05015A]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#05015A]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-[#05015A] mb-3" />
              <p className="text-sm text-gray-400">Loading order...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {order && !loading && (
            <>
              {activeTab === "overview" && <OverviewTab order={order} />}
              {activeTab === "items" && <ItemsTab order={order} />}
              {activeTab === "delivery" && <DeliveryTab order={order} onUpdated={handleUpdated} />}
              {activeTab === "status" && <StatusTab order={order} onUpdated={handleUpdated} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;