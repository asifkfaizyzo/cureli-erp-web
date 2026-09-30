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
    <div className="flex items-center gap-1 border-b border-white/[0.08] px-6 overflow-x-auto scrollbar-none">
      {allTabs.map((tab) => {
        const isActive       = activeTab === tab.id;
        const isPrescription = tab.id === PRESCRIPTION_TAB_ID;
        const isNewOrders    = tab.id === 'new';

        const badgeCount = (isNewOrders || isPrescription)
          ? (counts[tab.id] ?? 0)
          : 0;

        const showBadge = badgeCount > 0;
        const shouldPulse = showBadge && (isNewOrders || isPrescription) && !isActive;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap
              border-b-2 transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-inset rounded-t-md
              ${
                isActive
                  ? 'border-indigo-400 text-white'
                  : 'border-transparent text-white/60 hover:text-white/90 hover:border-white/25'
              }
            `}
          >
            {isPrescription && (
              <FileText
                size={13}
                className={isActive ? 'text-white' : 'text-white/60'}
              />
            )}

            {tab.label}

            {showBadge && (
              <span
                className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  min-w-[18px] text-center
                  ${shouldPulse ? 'animate-pulse' : ''}
                  ${isActive
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500/80 text-white'}
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