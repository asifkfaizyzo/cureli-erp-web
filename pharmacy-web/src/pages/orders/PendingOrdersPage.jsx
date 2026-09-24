// pharmacy-web/src/pages/orders/PendingOrdersPage.jsx (do not remove this comment)
// src/pages/orders/PendingOrdersPage.jsx

import { motion } from "framer-motion";
import { 
  Package, 
  Bell,
  Zap,
  Clock,
  CheckSquare,
  ArrowLeft,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PendingOrdersPage = () => {
  const navigate = useNavigate();

  const plannedFeatures = [
    { 
      icon: Bell, 
      title: "Real-time Notifications",
      description: "Get instant alerts for new incoming orders"
    },
    { 
      icon: Zap, 
      title: "Quick Actions",
      description: "Accept, reject, or modify orders with one click"
    },
    { 
      icon: Clock, 
      title: "Time Tracking",
      description: "Track how long orders have been pending"
    },
    { 
      icon: Filter, 
      title: "Smart Filters",
      description: "Filter orders by status, time, or priority"
    },
    { 
      icon: CheckSquare, 
      title: "Bulk Processing",
      description: "Process multiple orders at once"
    },
    { 
      icon: Package, 
      title: "Order Details",
      description: "View complete order information instantly"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Orders</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-4 bg-amber-100 rounded-2xl mb-4">
            <Package className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Orders</h1>
          <p className="text-gray-500">Orders awaiting processing</p>
        </motion.div>

        {/* Coming Soon Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-3xl p-8 md:p-12 text-white mb-8 relative overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ 
                x: [0, 100, 0],
                y: [0, -50, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
            />
            <motion.div
              animate={{ 
                x: [0, -80, 0],
                y: [0, 60, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl"
            />
          </div>

          <div className="relative text-center">
            

            <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
              ⏳ Coming Soon
            </span>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real-Time Order Queue
            </h2>
            
            <p className="text-amber-100 max-w-xl mx-auto text-lg">
              View and process pending orders as they come in. Get instant notifications 
              and manage your order queue efficiently.
            </p>
          </div>
        </motion.div>

        {/* Planned Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Planned Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plannedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-xl p-5 border border-gray-100"
                >
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingOrdersPage;