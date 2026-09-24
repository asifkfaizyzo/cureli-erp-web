// pharmacy-web/src/components/common/NewOrderBanner.jsx (do not remove this comment)
// pharmacy-web/src/components/common/NewOrderBanner.jsx
// MODIFIED — adds prescription request count to banner

import { useEffect }          from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence }  from 'framer-motion';
import { ShoppingBag, ArrowRight }  from 'lucide-react';

import useOrderAlertStore               from '../../store/useOrderAlertStore';
import usePrescriptionRequestAlertStore from '../../store/usePrescriptionRequestAlertStore';
import { useAppModeStore }              from '../../store/useAppModeStore';
import { useMenuStore }                 from '../../store/useMenuStore';
import { getOrders }                    from '../../api/marketplaceOrders';
import { getErpRequests }               from '../../api/prescriptionRequests';

// Banner is hidden on pages where user is already viewing the content
const HIDDEN_ON_ROUTES = new Set([
  '/marketplace/orders',
  '/marketplace/prescription-requests',
]);

const NewOrderBanner = () => {
  const navigate   = useNavigate();
  const location   = useLocation();

  // ── Order alert state ─────────────────────────────────────────────────────
  const pendingOrderIds = useOrderAlertStore((s) => s.pendingOrderIds);
  const orderRefresh    = useOrderAlertStore((s) => s.refreshCount);
  const setOrderRefresh = useOrderAlertStore((s) => s.setRefreshCount);

  // ── Prescription request alert state ─────────────────────────────────────
  const pendingRequestIds = usePrescriptionRequestAlertStore((s) => s.pendingRequestIds);
  const requestRefresh    = usePrescriptionRequestAlertStore((s) => s.refreshCount);
  const setRequestRefresh = usePrescriptionRequestAlertStore((s) => s.setRefreshCount);

  const setAppMode     = useAppModeStore((s) => s.setAppMode);
  const setActiveMenu  = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  // ── On mount: fetch counts for refresh-recovery ───────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      try {
        // Fetch PLACED orders count (existing)
        const orderRes = await getOrders({ status: 'PLACED', page: 1, limit: 1 });
        if (!cancelled && orderRes.success) {
          setOrderRefresh(orderRes.data?.meta?.total ?? 0);
        }
      } catch {
        if (!cancelled) setOrderRefresh(0);
      }

      try {
        // Fetch SENT prescription requests count (new)
        const requestRes = await getErpRequests({ status: 'SENT', page: 1, limit: 1 });
        if (!cancelled && requestRes.success) {
          setRequestRefresh(requestRes.data?.meta?.total ?? 0);
        }
      } catch {
        if (!cancelled) setRequestRefresh(0);
      }
    };

    fetchCounts();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived counts ────────────────────────────────────────────────────────
  const orderSseCount    = Object.keys(pendingOrderIds).length;
  const orderCount       = Math.max(orderSseCount,   orderRefresh   > 0 ? orderRefresh   : 0);

  const requestSseCount  = Object.keys(pendingRequestIds).length;
  const requestCount     = Math.max(requestSseCount, requestRefresh > 0 ? requestRefresh : 0);

  const isHiddenRoute    = HIDDEN_ON_ROUTES.has(location.pathname);
  const isVisible        = (orderCount > 0 || requestCount > 0) && !isHiddenRoute;

  // ── Banner text ───────────────────────────────────────────────────────────
  let bannerText;
  if (orderCount > 0 && requestCount > 0) {
    bannerText =
      `${orderCount} new order${orderCount !== 1 ? 's' : ''} and ` +
      `${requestCount} prescription request${requestCount !== 1 ? 's' : ''} awaiting action`;
  } else if (orderCount > 0) {
    bannerText = `${orderCount} new order${orderCount !== 1 ? 's' : ''} awaiting action`;
  } else {
    bannerText =
      `${requestCount} prescription request${requestCount !== 1 ? 's' : ''} awaiting action`;
  }

  // ── Navigation — go to whichever has pending items (orders take priority) ─
const handleView = () => {
  setAppMode('MARKETPLACE');
  setActiveMenu('marketplace-orders');
  setBreadcrumbs(['Marketplace', 'Orders']);

  if (orderCount > 0) {
    // Orders pending — land on default orders tab
    navigate('/marketplace/orders');
  } else {
    // Only prescription requests pending — land on prescriptions tab
    navigate('/marketplace/orders?tab=prescriptions');
  }
};

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="new-order-banner"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-16 left-0 right-0 z-40 flex justify-center pointer-events-none"
        >
          <motion.div
            className="
              pointer-events-auto
              flex items-center gap-3
              mx-4 mt-2
              px-4 py-2.5
              rounded-xl
              bg-[#010015]
              border border-white/[0.12]
              shadow-2xl shadow-black/40
            "
            animate={{
              boxShadow: [
                '0 0 0 0px rgba(239,68,68,0)',
                '0 0 0 4px rgba(239,68,68,0.15)',
                '0 0 0 0px rgba(239,68,68,0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Icon */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <ShoppingBag size={15} className="text-red-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full">
                <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
              </span>
            </div>

            {/* Text */}
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold leading-tight">
                {bannerText}
              </span>
              <span className="text-white/40 text-[11px] leading-tight mt-0.5">
                Accept or reject to stop this alert
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={handleView}
              className="
                ml-2 flex items-center gap-1.5
                px-3 py-1.5 rounded-lg
                bg-white text-[#010015]
                text-xs font-bold
                hover:bg-white/90
                transition-colors duration-150
                flex-shrink-0
              "
            >
              View
              <ArrowRight size={12} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewOrderBanner;