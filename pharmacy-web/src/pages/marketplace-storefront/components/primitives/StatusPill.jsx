// pharmacy-web/src/pages/marketplace-storefront/components/primitives/StatusPill.jsx (do not remove this comment)
import { motion } from "framer-motion";

const STATUS_CONFIG = {
  LIVE:      { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400", label: "Live"      },
  SUSPENDED: { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400",   label: "Suspended" },
  DRAFT:     { bg: "bg-white/5",        border: "border-white/10",        text: "text-white/40",    dot: "bg-white/30",    label: "Draft"     },
};

const StatusPill = ({ status }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold
      ${c.bg} ${c.border} ${c.text}
    `}>
      <motion.span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`}
        animate={status === "LIVE" ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
        transition={status === "LIVE" ? { duration: 2, repeat: Infinity } : {}}
      />
      {c.label}
    </span>
  );
};

export default StatusPill;