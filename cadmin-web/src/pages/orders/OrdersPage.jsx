// cadmin-web/src/pages/orders/OrdersPage.jsx (do not remove this comment)
// src/pages/orders/OrdersPage.jsx

import { motion } from "framer-motion";
import { ClipboardList, Sparkles } from "lucide-react";

const OrdersPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center 
                    p-6 relative overflow-hidden">

      {/* Background Glow Circles */}
      <div className="absolute top-20 left-20 w-72 h-72  rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80  rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative bg-white/10 backdrop-blur-xl bg-gradient-to-br from-[#05015A] via-indigo-900 to-blue-900  border border-white/20
                   rounded-3xl p-12 max-w-lg w-full text-center text-white
                   shadow-2xl"
      >
        {/* Floating Icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="flex items-center justify-center w-20 h-20 
                     bg-white/20 rounded-2xl mx-auto mb-6"
        >
          <ClipboardList className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-4">
          Orders Management
        </h1>

        <p className="text-white/80 mb-6 text-lg">
          We're building a powerful and intelligent order system to help you
          manage customer requests, track fulfillment, and optimize delivery.
        </p>

        {/* Animated Badge */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center gap-2 px-6 py-2 
                     bg-white text-[#05015A] font-semibold 
                     rounded-full shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Coming Soon
        </motion.div>

        {/* Small Subtext */}
        <p className="text-sm text-white/60 mt-6">
          Stay tuned — exciting features are on the way 🚀
        </p>
      </motion.div>
    </div>
  );
};

export default OrdersPage;
