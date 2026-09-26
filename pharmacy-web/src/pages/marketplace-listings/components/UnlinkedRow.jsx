// pharmacy-web/src/pages/marketplace-listings/components/UnlinkedRow.jsx (do not remove this comment)
// src/pages/marketplace-listings/components/UnlinkedRow.jsx

import { motion } from "framer-motion";
import { AlertCircle, Clock, HelpCircle } from "lucide-react";

const LINK_STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-white/40",
    bg: "bg-white/[0.05] border-white/[0.08]",
  },
  SUGGESTED: {
    label: "Suggestion Ready",
    icon: HelpCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  UNLINKED: {
    label: "Not Linked",
    icon: AlertCircle,
    color: "text-red-400/70",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

const UnlinkedRow = ({ medicine, index }) => {
  const statusConfig =
    LINK_STATUS_CONFIG[medicine.link_status] ?? LINK_STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className={`border-b border-white/[0.04] transition-all duration-150 ${
        index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"
      }`}
    >
      {/* ERP Name */}
      <td className="px-4 py-3 border-r border-white/[0.04]">
        <p className="text-sm font-medium text-white/70 truncate">
          {medicine.erp_name}
        </p>
      </td>

      {/* Manufacturer */}
      <td className="px-4 py-3 border-r border-white/[0.04]">
        <p className="text-sm text-white/40 truncate">{medicine.manufacturer}</p>
      </td>

      {/* Link Status */}
      <td className="px-4 py-3 border-r border-white/[0.04] text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.color}`}
        >
          <StatusIcon size={9} />
          {statusConfig.label}
        </span>
      </td>

      {/* ERP Stock */}
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-bold text-white/50">
          {medicine.erp_stock}
        </span>
      </td>
    </motion.tr>
  );
};

export default UnlinkedRow;