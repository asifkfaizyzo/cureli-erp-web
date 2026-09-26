// cadmin-web/src/pages/Dashboard/comps/SubscriptionDonut.jsx (do not remove this comment)
// src/pages/Dashboard/comps/SubscriptionDonut.jsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PieChart as PieIcon, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getSubscriptionDistribution } from "../../../api/cadminDashboard";

const COLORS = {
  active: "#10B981",
  expiring: "#3B82F6",
  grace: "#F59E0B",
  suspended: "#EF4444",
};

const SubscriptionDonut = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getSubscriptionDistribution();
        setData(res.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Active", value: data.active || 0, color: COLORS.active },
      { name: "Expiring", value: data.expiring || 0, color: COLORS.expiring },
      { name: "Grace", value: data.grace || 0, color: COLORS.grace },
      { name: "Suspended", value: data.suspended || 0, color: COLORS.suspended },
    ].filter((d) => d.value > 0);
  }, [data]);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur rounded-xl border border-gray-100/80 p-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <PieIcon size={14} className="text-white" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-900">Subscriptions</h3>
          <p className="text-[9px] text-gray-400">Status breakdown</p>
        </div>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      ) : error ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
          <AlertCircle size={24} className="mb-1" />
          <p className="text-[10px]">{error}</p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                  {chartData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-gray-900/95 px-2 py-1 rounded text-[10px] text-white">
                        {payload[0].name}: {payload[0].value}
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-1.5">
            {chartData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-gray-500 flex-1">{d.name}</span>
                <span className="text-[10px] font-bold text-gray-800">{d.value}</span>
              </div>
            ))}
            <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-600">Total</span>
              <span className="text-xs font-bold text-gray-900">{total}</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/subscriptions")}
        className="w-full mt-3 pt-2 border-t border-gray-100 flex items-center justify-center gap-1 text-[10px] text-indigo-600 font-semibold hover:underline"
      >
        Risk Monitor <ArrowRight size={10} />
      </button>
    </motion.div>
  );
};

export default SubscriptionDonut;