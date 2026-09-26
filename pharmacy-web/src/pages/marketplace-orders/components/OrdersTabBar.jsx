// pharmacy-web/src/pages/marketplace-orders/components/OrdersTabBar.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-orders/components/OrdersTabBar.jsx

import { FileText } from 'lucide-react';
import { ORDER_TABS } from '../../../hooks/marketplace/useOrdersPage';

export const PRESCRIPTION_TAB_ID = 'prescriptions';

const PRESCRIPTION_TAB = {
  id:    PRESCRIPTION_TAB_ID,
  label: 'Prescriptions',
};

const OrdersTabBar = ({ activeTab, onTabChange, counts = {} }) => {
  const allTabs = [...ORDER_TABS, PRESCRIPTION_TAB];

  return (
    <div className="flex items-center gap-1 border-b border-white/[0.06] px-6">
      {allTabs.map((tab) => {
        const isActive       = activeTab === tab.id;
        const isPrescription = tab.id === PRESCRIPTION_TAB_ID;
        const isNewOrders    = tab.id === 'new';

        // Only 'new' and 'prescriptions' get badges
        // counts are passed from MarketplaceOrdersPage
        const badgeCount = (isNewOrders || isPrescription)
          ? (counts[tab.id] ?? 0)
          : 0;

        const showBadge = badgeCount > 0;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-3 text-sm font-medium
              border-b-2 transition-all duration-150
              ${
                isActive
                  ? 'border-white text-white'
                  : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
              }
            `}
          >
            {isPrescription && (
              <FileText
                size={13}
                className={isActive ? 'text-white' : 'text-white/40'}
              />
            )}

            {tab.label}

            {showBadge && (
              <span
                className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  min-w-[18px] text-center animate-pulse
                  ${isActive
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500/70 text-white'}
                `}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default OrdersTabBar;