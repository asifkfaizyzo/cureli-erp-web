// cadmin-web/src/pages/Fleet/Pricing/IncentivesPage.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/IncentivesPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, LayoutGrid, CalendarClock } from "lucide-react";

import TeamRiderNotice from "./comps/TeamRiderNotice";
import TemplateLibraryTab from "./comps/Incentives/TemplateLibraryTab";
import CalendarScheduleTab from "./comps/Incentives/CalendarScheduleTab";

const TABS = [
  { id: "calendar", label: "Calendar & Schedules", icon: CalendarClock },
  { id: "templates", label: "Template Library", icon: LayoutGrid },
];

export default function IncentivesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("calendar");

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/fleet/pricing")}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Incentives & Quests Engine</h1>
              <p className="text-xs text-gray-500">Reusable templates, stepper rewards, gating conditions, and calendar scheduling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors
                  ${active ? "text-[#05015A]" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Icon size={14} />
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="incentives-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#05015A]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-5">
          <TeamRiderNotice />
          {activeTab === "calendar" && <CalendarScheduleTab />}
          {activeTab === "templates" && <TemplateLibraryTab />}
        </div>
      </div>
    </div>
  );
}