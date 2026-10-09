// pharmacy-web/src/pages/marketplace-orders/components/OrderListPanel.jsx (do not remove this comment)
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
        <div className="flex flex-col h-full min-h-0">
      {/* Sticky Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.03] z-10 rounded-t-xl">
        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
          {total > 0 ? `${total} order${total !== 1 ? 's' : ''}` : 'Orders'}
        </span>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh orders"
          className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Scrollable List — ISOLATED */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {isLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <Loader2 size={22} className="animate-spin text-white/40" />
            <p className="text-xs text-white/50">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12">
            <p className="text-sm text-red-300 text-center">{error}</p>
            <button
              onClick={onRefresh}
              className="px-4 py-2 rounded-lg bg-white/[0.08] text-white/80 text-xs font-medium hover:bg-white/[0.12] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12">
            <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center">
              <ShoppingBag size={20} className="text-white/50" />
            </div>
            <p className="text-sm font-semibold text-white/70 text-center">
              {tab?.emptyLabel ?? 'No orders'}
            </p>
            <p className="text-xs text-white/45 text-center max-w-[220px]">
              {tab?.emptyDesc ?? ''}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.order_id}
              order={order}
              isSelected={selectedOrderId === order.order_id}
              onSelect={onSelectOrder}
            />
          ))
        )}
      </div>

      {/* Sticky Pagination Footer */}
      {totalPages > 1 && orders.length > 0 && (
       <div className="flex-shrink-0 flex items-center justify-between gap-2 py-2.5 px-4 border-t border-white/[0.08] bg-white/[0.03] rounded-b-xl">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-white/80 text-xs font-semibold hover:bg-white/[0.14] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-white/60 font-medium">
            <span className="text-white/90 font-bold">{page}</span> / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-white/80 text-xs font-semibold hover:bg-white/[0.14] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderListPanel;