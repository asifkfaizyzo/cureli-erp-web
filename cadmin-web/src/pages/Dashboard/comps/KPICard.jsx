// cadmin-web/src/pages/Dashboard/comps/KPICard.jsx (do not remove this comment)
// src/pages/Dashboard/comps/KPICard.jsx

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";

const GRADIENTS = {
  green: "from-emerald-500 to-teal-600",
  blue: "from-blue-600 to-blue-900",
  purple: "from-purple-500 to-violet-600",
  amber: "from-amber-500 to-orange-600",
  red: "from-red-500 to-rose-600",
  pink: "from-pink-500 to-rose-600",
  teal: "from-teal-500 to-cyan-600",
  indigo: "from-indigo-500 to-blue-600",
  gray: "from-gray-500 to-slate-600",
};

const KPICardSkeleton = () => (
  <div className="bg-white/70 backdrop-blur rounded-xl p-3 border border-gray-100/80 animate-pulse">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      <div className="flex-1">
        <div className="h-2 bg-gray-200 rounded w-14 mb-1.5" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
    </div>
  </div>
);

const KPICard = ({
  title,
  value,
  sub,
  change,
  trend,
  icon: Icon,
  gradient = "blue",
  onClick,
  loading,
  delay = 0,
}) => {
  if (loading) return <KPICardSkeleton />;

  const isUp = trend === "up";
  const hasChange = change !== undefined && change !== null && !isNaN(change);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.04, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl p-3 
        border border-gray-100/80 shadow-sm hover:shadow-md hover:border-indigo-200/60
        transition-all duration-200 group ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${GRADIENTS[gradient]} 
        opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GRADIENTS[gradient]} 
          flex items-center justify-center shadow-sm group-hover:shadow-md 
          group-hover:scale-105 transition-all duration-200`}>
          <Icon size={14} className="text-white" strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-base font-extrabold text-gray-900 leading-tight truncate">
            {value}
          </p>
        </div>

        {hasChange && (
          <div className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full
            ${isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {isUp ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
            {Math.abs(change).toFixed(0)}%
          </div>
        )}
      </div>

      {sub && (
        <p className="text-[9px] text-gray-400 mt-1 pl-10 truncate">{sub}</p>
      )}

      {onClick && (
        <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 
          group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
      )}
    </motion.div>
  );
};

export default KPICard;