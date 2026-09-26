// cadmin-web/src/pages/Dashboard/comps/RevenueChart.jsx (do not remove this comment)
// src/pages/Dashboard/comps/RevenueChart.jsx

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { getRevenueData } from "../../../api/cadminDashboard";

const formatCurrency = (v) => {
  const n = parseFloat(v) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 backdrop-blur-lg p-2 rounded-lg shadow-xl border border-gray-700/50">
      <p className="text-[9px] font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: e.color }}
          />
          <span className="text-[10px] text-gray-400">{e.name}:</span>
          <span className="text-[10px] font-bold text-white ml-auto">
            {formatCurrency(e.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const RevenueChart = ({ period }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getRevenueData(period);
        setData(res.data);
      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [period]);

  const chartData = data?.data || [];
  const summary = data?.summary || {};

  //  FIX: Check against full chartData OR summary, not sampled displayData
  const hasData = useMemo(() => {
    if ((summary.total || 0) > 0) return true;
    if ((summary.transactionCount || 0) > 0) return true;
    return chartData.some((d) => d.value > 0);
  }, [chartData, summary]);

  //  FIX: Smart sampling that preserves non-zero data points
  const displayData = useMemo(() => {
    if (chartData.length <= 30) return chartData;

    const maxPoints = 30;
    const step = Math.ceil(chartData.length / maxPoints);

    // Collect indices that must be included (non-zero values)
    const nonZeroIndices = new Set();
    chartData.forEach((d, i) => {
      if (d.value > 0) {
        nonZeroIndices.add(i);
      }
    });

    // Collect sampled indices (evenly spaced)
    const sampledIndices = new Set();
    sampledIndices.add(0); // Always include first
    sampledIndices.add(chartData.length - 1); // Always include last

    for (let i = step; i < chartData.length - 1; i += step) {
      sampledIndices.add(i);
    }

    // Merge: sampled + all non-zero
    const allIndices = new Set([...sampledIndices, ...nonZeroIndices]);

    // Sort and build result
    const sortedIndices = Array.from(allIndices).sort((a, b) => a - b);
    return sortedIndices.map((i) => chartData[i]);
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur rounded-xl border border-gray-100/80 p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <DollarSign size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Revenue</h3>
            <p className="text-[9px] text-gray-400">Period overview</p>
          </div>
        </div>

        {!loading && !error && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(summary.total || 0)}
              </p>
              <p className="text-[9px] text-gray-400">
                {summary.transactionCount || 0} transactions
              </p>
            </div>
            {(summary.total || 0) > 0 && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 rounded text-[9px] font-semibold text-emerald-600">
                <TrendingUp size={10} />
                Active
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ width: "100%", height: 180, minHeight: 180, minWidth: 0 }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <AlertCircle size={24} className="mb-1" />
            <p className="text-[10px]">{error}</p>
          </div>
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <DollarSign size={28} className="mb-1 opacity-50" />
            <p className="text-[10px]">No revenue data for this period</p>
            <p className="text-[9px] text-gray-400 mt-0.5">
              Transactions will appear here
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v)}
                width={50}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                fill="url(#revGrad)"
                strokeWidth={2}
                name="Revenue"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default RevenueChart;
