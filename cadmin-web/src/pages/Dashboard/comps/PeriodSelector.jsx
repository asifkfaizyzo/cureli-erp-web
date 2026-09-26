// cadmin-web/src/pages/Dashboard/comps/PeriodSelector.jsx (do not remove this comment)
// src/pages/Dashboard/comps/PeriodSelector.jsx

import { useState, useRef, useEffect } from "react";
import { Calendar, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PERIODS = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

const PeriodSelector = ({ value, onChange }) => {
  return (
    <div className="flex bg-white/80 backdrop-blur rounded-xl border border-gray-200/60 p-0.5 shadow-sm">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
            value === p.value
              ? "bg-[#000060] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodSelector;