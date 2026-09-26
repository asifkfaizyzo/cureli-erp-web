// cadmin-web/src/pages/Dashboard/comps/AlertsBanner.jsx (do not remove this comment)
// src/pages/Dashboard/comps/AlertsBanner.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, X, ChevronRight, ChevronLeft } from "lucide-react";

const STYLES = {
  error: { bg: "bg-red-50/80", border: "border-red-200/60", text: "text-red-700", icon: "text-red-500" },
  warning: { bg: "bg-amber-50/80", border: "border-amber-200/60", text: "text-amber-700", icon: "text-amber-500" },
  info: { bg: "bg-blue-50/80", border: "border-blue-200/60", text: "text-blue-700", icon: "text-blue-500" },
};

const AlertsBanner = ({ alerts = [], onDismiss }) => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  if (alerts.length === 0) return null;

  const alert = alerts[current];
  const s = STYLES[alert.type] || STYLES.info;
  const Icon = alert.type === "error" ? AlertCircle : alert.type === "warning" ? AlertTriangle : Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm ${s.bg} ${s.border}`}
    >
      <Icon size={14} className={s.icon} />
      
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-semibold ${s.text}`}>{alert.title}: </span>
        <span className={`text-xs ${s.text} opacity-80`}>{alert.message}</span>
      </div>

      {alert.action && (
        <button
          onClick={() => navigate(alert.action.path)}
          className={`text-[10px] font-semibold ${s.text} hover:underline flex items-center gap-0.5 flex-shrink-0`}
        >
          {alert.action.label}
          <ChevronRight size={10} />
        </button>
      )}

      {alerts.length > 1 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setCurrent((p) => (p === 0 ? alerts.length - 1 : p - 1))} className="p-0.5 hover:bg-black/5 rounded">
            <ChevronLeft size={12} className={s.text} />
          </button>
          <span className={`text-[9px] ${s.text}`}>{current + 1}/{alerts.length}</span>
          <button onClick={() => setCurrent((p) => (p === alerts.length - 1 ? 0 : p + 1))} className="p-0.5 hover:bg-black/5 rounded">
            <ChevronRight size={12} className={s.text} />
          </button>
        </div>
      )}

      <button onClick={() => onDismiss?.(alert.id)} className="p-0.5 hover:bg-black/5 rounded flex-shrink-0">
        <X size={12} className={s.text} />
      </button>
    </motion.div>
  );
};

export default AlertsBanner;