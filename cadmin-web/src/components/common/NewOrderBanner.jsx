import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Eye, FileText } from 'lucide-react';
import useOrderAlertStore from '../../store/useOrderAlertStore';
import usePrescriptionRequestAlertStore from '../../store/usePrescriptionRequestAlertStore';

const NewOrderBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Existing Order Alerts Store ──
  const isOrderAlertActive = useOrderAlertStore((s) => s.isAlertActive);
  const newOrderCount = useOrderAlertStore((s) => s.newOrderCount);
  const dismissOrderAlert = useOrderAlertStore((s) => s.dismissAlert);

  // ── New Prescription Request Alerts Store ──
  const isRxAlertActive = usePrescriptionRequestAlertStore((s) => s.isAlertActive);
  const newRxCount = usePrescriptionRequestAlertStore((s) => s.newRequestCount);
  const dismissRxAlert = usePrescriptionRequestAlertStore((s) => s.dismissAlert);

  // Hidden if on the orders view to prevent UI conflicts
  const isHiddenRoute = location.pathname === '/marketplace/orders';
  const isOrderVisible = isOrderAlertActive && !isHiddenRoute;
  const isRxVisible = isRxAlertActive && !isHiddenRoute;

  const handleViewOrders = () => {
    dismissOrderAlert();
    navigate('/marketplace/orders?view=orders');
  };

  const handleViewPrescriptions = () => {
    dismissRxAlert();
    navigate('/marketplace/orders?view=prescriptions');
  };

  const orderBannerText = newOrderCount > 1
    ? `${newOrderCount} new marketplace orders received!`
    : 'A shop received a new marketplace order';

  const rxBannerText = newRxCount > 1
    ? `${newRxCount} new prescription requests received!`
    : 'A customer submitted a new prescription request';

  return (
    <div className="fixed top-20 left-0 right-0 z-[100] flex flex-col items-center gap-3 pointer-events-none">
      <AnimatePresence>
        
        {/* ── MARKETPLACE ORDER BANNER (Red theme) ── */}
        {isOrderVisible && (
          <motion.div
            key="cadmin-new-order-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-none flex justify-center w-full"
          >
            <motion.div
              className="
                pointer-events-auto
                flex items-center gap-4
                mx-4 px-5 py-3
                rounded-2xl
                bg-gray-900 text-white
                border border-white/10
                shadow-2xl shadow-black/60
              "
              animate={{
                boxShadow: [
                  '0 0 0 0px rgba(239, 68, 68, 0)',
                  '0 0 0 6px rgba(239, 68, 68, 0.2)',
                  '0 0 0 0px rgba(239, 68, 68, 0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Warning Ring */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/35 flex items-center justify-center">
                  <ShoppingBag size={17} className="text-red-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full">
                  <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                </span>
              </div>

              {/* Typography */}
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight leading-none text-white">
                  {orderBannerText}
                </span>
                <span className="text-gray-400 text-[11px] leading-tight mt-1">
                  Manual delivery dispatch or partner tracking required
                </span>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                <button
                  onClick={handleViewOrders}
                  className="
                    flex items-center gap-1.5
                    px-3.5 py-1.5 rounded-lg
                    bg-[#05015A] text-white
                    text-xs font-bold hover:bg-[#05015A]/90
                    transition-colors border border-white/5
                  "
                >
                  <Eye size={13} />
                  View
                </button>
                <button
                  onClick={dismissOrderAlert}
                  className="
                    flex items-center gap-1
                    px-3.5 py-1.5 rounded-lg
                    bg-white/10 text-white
                    text-xs font-bold hover:bg-white/15
                    transition-colors border border-white/5
                  "
                >
                  Okay
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── PRESCRIPTION REQUEST BANNER (Teal theme) ── */}
        {isRxVisible && (
          <motion.div
            key="cadmin-new-rx-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-none flex justify-center w-full"
          >
            <motion.div
              className="
                pointer-events-auto
                flex items-center gap-4
                mx-4 px-5 py-3
                rounded-2xl
                bg-gray-900 text-white
                border border-white/10
                shadow-2xl shadow-black/60
              "
              animate={{
                boxShadow: [
                  '0 0 0 0px rgba(20, 184, 166, 0)',
                  '0 0 0 6px rgba(20, 184, 166, 0.2)',
                  '0 0 0 0px rgba(20, 184, 166, 0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Warning Ring */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/35 flex items-center justify-center">
                  <FileText size={17} className="text-teal-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-teal-500 rounded-full">
                  <span className="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-75" />
                </span>
              </div>

              {/* Typography */}
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight leading-none text-white">
                  {rxBannerText}
                </span>
                <span className="text-gray-400 text-[11px] leading-tight mt-1">
                  Pharmacies nearby notified to review and build quotes
                </span>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                <button
                  onClick={handleViewPrescriptions}
                  className="
                    flex items-center gap-1.5
                    px-3.5 py-1.5 rounded-lg
                    bg-[#05015A] text-white
                    text-xs font-bold hover:bg-[#05015A]/90
                    transition-colors border border-white/5
                  "
                >
                  <Eye size={13} />
                  View
                </button>
                <button
                  onClick={dismissRxAlert}
                  className="
                    flex items-center gap-1
                    px-3.5 py-1.5 rounded-lg
                    bg-white/10 text-white
                    text-xs font-bold hover:bg-white/15
                    transition-colors border border-white/5
                  "
                >
                  Okay
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default NewOrderBanner;