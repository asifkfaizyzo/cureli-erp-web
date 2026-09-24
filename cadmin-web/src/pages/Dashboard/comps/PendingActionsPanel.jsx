// cadmin-web/src/pages/Dashboard/comps/PendingActionsPanel.jsx (do not remove this comment)
// src/pages/Dashboard/comps/PendingActionsPanel.jsx

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Ticket, Mail, AlertTriangle, Clock, Ban, ArrowRight, CheckCircle2 } from "lucide-react";

const PendingActionsPanel = ({ data, pendingCounts, role }) => {
  const navigate = useNavigate();

  let items = [];

  if (role === "SUPER_CADMIN") {
    items = [
      { id: "verify", label: "Verifications", count: pendingCounts?.pendingVerifications || data?.shops?.pendingVerification || 0, icon: ShieldCheck, color: "purple", path: "/verification", urgent: false },
      { id: "tickets", label: "Tickets", count: pendingCounts?.pendingTickets || data?.tickets?.totalOpen || 0, icon: Ticket, color: "orange", path: "/communications/tickets", urgent: true },
      { id: "enquiries", label: "Enquiries", count: pendingCounts?.pendingEnquiries || data?.enquiries?.pending || 0, icon: Mail, color: "teal", path: "/communications/enquiries", urgent: false },
      { id: "risk", label: "At Risk", count: data?.subscriptions?.atRiskTotal || 0, icon: AlertTriangle, color: "red", path: "/subscriptions", urgent: true },
    ];
  } else if (role === "ANALYST") {
    items = [
      { id: "verify", label: "Verifications", count: data?.shops?.pendingVerification || 0, icon: ShieldCheck, color: "purple", path: "/verification" },
      { id: "tickets", label: "Tickets", count: data?.tickets?.totalOpen || 0, icon: Ticket, color: "orange", path: "/communications/tickets", urgent: true },
      { id: "enquiries", label: "Enquiries", count: data?.enquiries?.pending || 0, icon: Mail, color: "teal", path: "/communications/enquiries" },
    ];
  } else if (role === "ACCOUNTANT") {
    items = [
      { id: "expiring", label: "Expiring", count: data?.subscriptions?.expiring || 0, icon: Clock, color: "blue", path: "/subscriptions/risk" },
      { id: "grace", label: "Grace", count: data?.subscriptions?.gracePeriod || 0, icon: AlertTriangle, color: "amber", path: "/subscriptions/risk", urgent: true },
      { id: "suspended", label: "Suspended", count: data?.subscriptions?.suspended || 0, icon: Ban, color: "red", path: "/subscriptions/risk", urgent: true },
    ];
  }

  const total = items.reduce((s, i) => s + i.count, 0);

  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-4 py-3 flex items-center gap-3"
      >
        <CheckCircle2 size={18} className="text-emerald-500" />
        <div>
          <p className="text-xs font-semibold text-emerald-700">All caught up!</p>
          <p className="text-[10px] text-emerald-600">No pending actions</p>
        </div>
      </motion.div>
    );
  }

  const colors = {
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    teal: "bg-teal-100 text-teal-600",
    red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
  };

  const gridClass = items.length <= 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="bg-white/80 backdrop-blur rounded-xl border border-gray-100/80 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pending</span>
        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded-full">{total}</span>
      </div>

      <div className={`grid ${gridClass} gap-2`}>
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(item.path)}
            className={`relative flex items-center gap-2 p-2.5 rounded-lg border transition-all hover:shadow-sm group
              ${item.urgent && item.count > 0 ? "border-red-200 bg-red-50/50" : "border-gray-100 hover:border-gray-200"}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[item.color]}`}>
              <item.icon size={12} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-gray-900">{item.count}</p>
              <p className="text-[9px] text-gray-400 truncate">{item.label}</p>
            </div>
            <ArrowRight size={10} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
            {item.urgent && item.count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PendingActionsPanel;