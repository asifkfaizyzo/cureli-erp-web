// pharmacy-web/src/pages/orders/CompletedOrdersPage.jsx (do not remove this comment)
// src/pages/orders/CompletedOrdersPage.jsx

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Star,
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CompletedOrdersPage = () => {
  const navigate = useNavigate();

  const plannedFeatures = [
    {
      icon: Calendar,
      title: "Order History",
      description: "Browse complete history of fulfilled orders",
    },
    {
      icon: Star,
      title: "Customer Ratings",
      description: "View ratings and feedback from customers",
    },
    {
      icon: TrendingUp,
      title: "Performance Metrics",
      description: "Track fulfillment rate and efficiency",
    },
    {
      icon: BarChart3,
      title: "Sales Analytics",
      description: "Analyze revenue and order trends",
    },
    {
      icon: Download,
      title: "Export Reports",
      description: "Download order data in various formats",
    },
    {
      icon: CheckCircle2,
      title: "Order Details",
      description: "Access detailed information for any order",
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
          <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-2xl mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Completed Orders
          </h1>
          <p className="text-gray-500">Successfully fulfilled orders</p>
        </motion.div>

        {/* Coming Soon Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 rounded-3xl p-8 md:p-12 text-white mb-8 relative overflow-hidden"
        >
          {/* Animated Checkmarks Background */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
                className="absolute"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
            ))}
          </div>

          <div className="relative text-center">
            <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
              Coming Soon
            </span>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Order History & Analytics
            </h2>

            <p className="text-green-100 max-w-xl mx-auto text-lg">
              View your complete order history, analyze trends, and track
              customer satisfaction. Export detailed reports for business
              insights.
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
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h4>
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

export default CompletedOrdersPage;
