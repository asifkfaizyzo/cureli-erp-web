// cadmin-web/src/pages/Dashboard/comps/UserGrowthChart.jsx (do not remove this comment)
// src/pages/Dashboard/comps/UserGrowthChart.jsx

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";
import { getUserGrowthData } from "../../../api/cadminDashboard";

const UserGrowthChart = ({ period }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getUserGrowthData(period);
        setData(res.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [period]);

  const chartData = data?.data || [];
  const summary = data?.summary || {};
  const userGrowth = summary.userGrowth || 0;
  const shopGrowth = summary.shopGrowth || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur rounded-xl border border-gray-100/80 p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Users size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">User Growth</h3>
            <p className="text-[9px] text-gray-400">Shops & users over time</p>
          </div>
        </div>

        {!loading && !error && (
          <div className="flex items-center gap-3">
            <div className="text-center px-2 py-1 bg-blue-50 rounded-lg">
              <p className="text-[9px] text-blue-600">Shops</p>
              <div className="flex items-center gap-0.5">
                <span className="text-xs font-bold text-blue-700">{summary.totalShops || 0}</span>
                {shopGrowth !== 0 && (
                  <span className={`text-[8px] ${shopGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {shopGrowth >= 0 ? "+" : ""}{shopGrowth}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-center px-2 py-1 bg-indigo-50 rounded-lg">
              <p className="text-[9px] text-indigo-600">Users</p>
              <div className="flex items-center gap-0.5">
                <span className="text-xs font-bold text-indigo-700">{summary.totalUsers || 0}</span>
                {userGrowth !== 0 && (
                  <span className={`text-[8px] ${userGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {userGrowth >= 0 ? "+" : ""}{userGrowth}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-[140px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <AlertCircle size={24} className="mb-1" />
            <p className="text-[10px]">{error}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <Users size={28} className="mb-1 opacity-50" />
            <p className="text-[10px]">No growth data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9CA3AF" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
              <YAxis tick={{ fontSize: 8, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-gray-900/95 px-2 py-1.5 rounded text-[9px]">
                      <p className="text-gray-300 mb-1">{label}</p>
                      {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-white">{p.name}: {p.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Area type="monotone" dataKey="users" stroke="#6366f1" fill="url(#userGrad)" strokeWidth={2} name="Users" dot={false} />
              <Line type="monotone" dataKey="shops" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 2" name="Shops" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default UserGrowthChart;