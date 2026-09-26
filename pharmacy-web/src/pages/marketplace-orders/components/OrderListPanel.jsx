// pharmacy-web/src/pages/marketplace-orders/components/OrderListPanel.jsx (do not remove this comment)
// ============================================
// components/OrderListPanel.jsx
// ============================================

import { Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import OrderCard from './OrderCard';
import { ORDER_TABS } from '../../../hooks/marketplace/useOrdersPage';

const OrderListPanel = ({
  activeTab,
  orders,
  isLoading,
  error,
  selectedOrderId,
  onSelectOrder,
  page,
  totalPages,
  total,
  onPageChange,
  onRefresh,
}) => {
  const tab = ORDER_TABS.find((t) => t.id === activeTab);

  return (
    <div className="flex flex-col h-full border-r border-white/[0.06]">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          {total > 0 ? `${total} order${total !== 1 ? 's' : ''}` : 'Orders'}
        </span>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={24} className="animate-spin text-white/20" />
            <p className="text-xs text-white/30">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
            <p className="text-sm text-red-400 text-center">{error}</p>
            <button
              onClick={onRefresh}
              className="px-4 py-2 rounded-lg bg-white/[0.06] text-white/60 text-xs font-medium hover:bg-white/[0.10] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <ShoppingBag size={20} className="text-white/20" />
            </div>
            <p className="text-sm font-medium text-white/30 text-center">
              {tab?.emptyLabel ?? 'No orders'}
            </p>
            <p className="text-xs text-white/20 text-center">
              {tab?.emptyDesc ?? ''}
            </p>
          </div>
        ) : (
          <>
            {orders.map((order) => (
              <OrderCard
                key={order.order_id}
                order={order}
                isSelected={selectedOrderId === order.order_id}
                onSelect={onSelectOrder}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 px-4 border-t border-white/[0.06]">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/50 text-xs font-medium hover:bg-white/[0.09] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-white/30">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages || isLoading}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/50 text-xs font-medium hover:bg-white/[0.09] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderListPanel;