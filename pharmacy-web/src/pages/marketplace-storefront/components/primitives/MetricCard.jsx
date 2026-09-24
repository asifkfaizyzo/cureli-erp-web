// pharmacy-web/src/pages/marketplace-storefront/components/primitives/MetricCard.jsx (do not remove this comment)
import { motion } from "framer-motion";

const MetricCard = ({ icon: Icon, label, value, accent }) => (
  <motion.div
    whileHover={{ y: -1 }}
    className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors"
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ?? "bg-white/[0.06]"}`}>
      <Icon size={16} className="text-white/60" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-white/30 font-medium truncate">{label}</p>
      <p className="text-sm font-bold text-white mt-0.5">{value}</p>
    </div>
  </motion.div>
);

export default MetricCard;