// pharmacy-web/src/pages/marketplace-dashboard/components/TrendChart.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/TrendChart.jsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const orders = payload.find((p) => p.dataKey === 'order_count');
  const value  = payload.find((p) => p.dataKey === 'order_value');

  return (
    <div className="bg-[#0d0b2e] border border-white/[0.10] rounded-xl px-3 py-2.5 shadow-xl shadow-black/50">
      <p className="text-[11px] text-white/40 mb-1.5 font-medium">
        {label}
      </p>
      {orders && (
        <div className="flex items-center gap-2 text-[12px]">
          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
          <span className="text-white/60">Orders</span>
          <span className="text-white font-bold ml-auto pl-4">
            {orders.value}
          </span>
        </div>
      )}
      {value && (
        <div className="flex items-center gap-2 text-[12px] mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="text-white/60">Value</span>
          <span className="text-white font-bold ml-auto pl-4">
            ₹{Number(value.value).toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// METRIC TOGGLE BUTTON
// ─────────────────────────────────────────────────────────────────────────────

const MetricToggle = ({ label, active, color, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold
      border transition-all duration-150
      ${active
        ? `${color.activeBg} ${color.text} ${color.activeBorder}`
        : 'bg-white/[0.03] text-white/30 border-white/[0.07] hover:bg-white/[0.06]'
      }
    `}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${active ? color.dot : 'bg-white/20'}`} />
    {label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TrendChart = ({ trend }) => {
  const [showOrders, setShowOrders] = useState(true);
  const [showValue,  setShowValue]  = useState(true);

  // Format dates for display
  const chartData = trend.map((d) => ({
    ...d,
    dayLabel: format(parseISO(d.date), 'dd MMM'),
  }));

  // Summary stats
  const totalOrders = trend.reduce((s, d) => s + d.order_count, 0);
  const totalValue  = trend.reduce((s, d) => s + d.order_value, 0);
  const avgOrders   = trend.length > 0
    ? (totalOrders / trend.length).toFixed(1)
    : 0;

  return (
    <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white/80">
            7-Day Trend
          </h2>
        </div>

        {/* Metric toggles */}
        <div className="flex items-center gap-1.5">
          <MetricToggle
            label="Orders"
            active={showOrders}
            onClick={() => setShowOrders((v) => !v)}
            color={{
              activeBg:     'bg-blue-500/10',
              text:         'text-blue-400',
              activeBorder: 'border-blue-500/20',
              dot:          'bg-blue-400',
            }}
          />
          <MetricToggle
            label="Value"
            active={showValue}
            onClick={() => setShowValue((v) => !v)}
            color={{
              activeBg:     'bg-emerald-500/10',
              text:         'text-emerald-400',
              activeBorder: 'border-emerald-500/20',
              dot:          'bg-emerald-400',
            }}
          />
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '7d Orders',  value: totalOrders },
          { label: 'Daily Avg',  value: avgOrders },
          { label: '7d Value',   value: `₹${(totalValue / 1000).toFixed(1)}K` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-center"
          >
            <p className="text-sm font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#34d399" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="dayLabel"
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              yAxisId="orders"
              orientation="left"
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />

            {showValue && (
              <YAxis
                yAxisId="value"
                orientation="right"
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
            )}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'rgba(255,255,255,0.08)',
                strokeWidth: 1,
              }}
            />

            {showOrders && (
              <Area
                yAxisId="orders"
                type="monotone"
                dataKey="order_count"
                name="Orders"
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#colorOrders)"
                dot={{ fill: '#60a5fa', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#60a5fa', stroke: '#010015', strokeWidth: 2 }}
              />
            )}

            {showValue && (
              <Area
                yAxisId="value"
                type="monotone"
                dataKey="order_value"
                name="Order Value"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#colorValue)"
                dot={{ fill: '#34d399', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#34d399', stroke: '#010015', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;