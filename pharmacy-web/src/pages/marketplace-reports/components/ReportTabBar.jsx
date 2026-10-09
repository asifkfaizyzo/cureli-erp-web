// pharmacy-web/src/pages/marketplace-reports/components/ReportTabBar.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/ReportTabBar.jsx

import React from "react";
import {
  ShoppingBag,
  Filter,
  FileText,
  Activity,
  AlertOctagon,
  Gauge,
  IndianRupee,
} from "lucide-react";

export const REPORT_TABS = [
  { id: "sales", label: "Sales & Revenue", icon: ShoppingBag },
  { id: "pipeline", label: "Pipeline & Funnel", icon: Filter },
  { id: "prescriptions", label: "Prescriptions", icon: FileText },
  { id: "catalog", label: "Catalog Health", icon: Activity },
  { id: "leakage", label: "Revenue Leakage", icon: AlertOctagon },
  { id: "speed", label: "Fulfillment Speed", icon: Gauge },
  { id: "earnings", label: "Earnings Trend", icon: IndianRupee },
];

const ReportTabBar = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-1 px-6 border-b border-white/[0.08] bg-[#010015] overflow-x-auto scrollbar-none">
      {REPORT_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 relative ${
              isActive
                ? "border-indigo-400 text-white font-bold bg-white/[0.02]"
                : "border-transparent text-white/45 hover:text-white/80 hover:bg-white/[0.02]"
            }`}
          >
            <Icon
              size={14}
              className={`transition-colors ${
                isActive ? "text-indigo-400" : "text-white/40"
              }`}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ReportTabBar;