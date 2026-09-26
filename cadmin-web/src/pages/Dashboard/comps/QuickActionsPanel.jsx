// cadmin-web/src/pages/Dashboard/comps/QuickActionsPanel.jsx (do not remove this comment)
// src/pages/Dashboard/comps/QuickActionsPanel.jsx

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, UserPlus, ShieldCheck, Radio, FileText, Settings } from "lucide-react";

const ACTIONS = [
  { id: "plan", label: "Plan", icon: Plus, gradient: "from-blue-700 to-blue-900", path: "/subscriptions/manage" },
  { id: "admin", label: "Admin", icon: UserPlus, gradient: "from-blue-700 to-blue-900", path: "/admins" },
  { id: "verify", label: "Verify", icon: ShieldCheck, gradient: "from-blue-700 to-blue-900", path: "/verification" },
  { id: "broadcast", label: "Broadcast", icon: Radio, gradient: "from-blue-700 to-blue-900", path: "/communications/broadcast" },
  { id: "audit", label: "Audit", icon: FileText, gradient: "from-blue-700 to-blue-900", path: "/audits" },
  { id: "settings", label: "Settings", icon: Settings, gradient: "from-slate-500 to-gray-700", path: "/settings" },
];

const QuickActionsPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      {ACTIONS.map((a, i) => (
        <motion.button
          key={a.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 400 }}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(a.path)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r ${a.gradient} 
            text-white font-semibold text-[10px] shadow-md hover:shadow-lg transition-all flex-shrink-0`}
        >
          <a.icon size={12} strokeWidth={2.5} />
          {a.label}
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActionsPanel;