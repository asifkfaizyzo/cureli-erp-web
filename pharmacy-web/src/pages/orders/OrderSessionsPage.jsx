// pharmacy-web/src/pages/orders/OrderSessionsPage.jsx (do not remove this comment)
// src/pages/orders/OrderSessionsPage.jsx

import { motion } from "framer-motion";
import { 
  Clock, 
  Calendar, 
  Users, 
  Repeat,
  Timer,
  ListChecks,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const OrderSessionsPage = () => {
  const navigate = useNavigate();

  const plannedFeatures = [
    { 
      icon: Calendar, 
      title: "Create Sessions",
      description: "Define time-based order collection sessions"
    },
    { 
      icon: Repeat, 
      title: "Recurring Sessions",
      description: "Set up daily or weekly recurring sessions"
    },
    { 
      icon: Timer, 
      title: "Session Timers",
      description: "Auto-close sessions when time expires"
    },
    { 
      icon: Users, 
      title: "Staff Assignment",
      description: "Assign team members to handle sessions"
    },
    { 
      icon: ListChecks, 
      title: "Order Grouping",
      description: "Group orders by session for easy processing"
    },
    { 
      icon: Clock, 
      title: "Session Analytics",
      description: "Track performance across different sessions"
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
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-2xl mb-4">
            <Clock className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Sessions</h1>
          <p className="text-gray-500">Time-based order management</p>
        </motion.div>

        {/* Coming Soon Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-3xl p-8 md:p-12 text-white mb-8 relative overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -right-20 w-64 h-64 border border-white/10 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-20 -left-20 w-48 h-48 border border-white/10 rounded-full"
            />
          </div>

          <div className="relative text-center">

            <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
              🚀 Coming Soon
            </span>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Session-Based Order Management
            </h2>
            
            <p className="text-indigo-100 max-w-xl mx-auto text-lg">
              Organize your orders into time-based sessions for better workflow management 
              and efficient delivery scheduling.
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
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-indigo-600" />
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

export default OrderSessionsPage;