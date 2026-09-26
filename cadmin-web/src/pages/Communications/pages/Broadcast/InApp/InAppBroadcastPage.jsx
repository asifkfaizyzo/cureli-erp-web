// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/InAppBroadcastPage.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/InApp/InAppBroadcastPage.jsx

import { useState } from "react";
import {
  Megaphone,
  Archive,
  Calendar,
  History,
  Plus,
} from "lucide-react";
import CreateBroadcastForm from "./comps/CreateBroadcastForm";
import DraftsList from "./comps/DraftsList";
import ScheduledList from "./comps/ScheduledList";
import HistoryList from "./comps/HistoryList";
import { useCAdminPermission } from "../../../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../../../config/cadminPermissions";
import NoPermission from "../../../../../components/common/NoPermission";

const InAppBroadcastPage = () => {
  // ── Permission gates ─────────────────────────────────────────────────────
  const { hasPermission } = useCAdminPermission();
  const canSend         = hasPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND);
  const canManageDrafts = hasPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS);
  const canSchedule     = hasPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE);
  const canViewHistory  = hasPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY);

  // Derive default tab based on what the admin can access
  const getDefaultTab = () => {
    if (canSend)         return "create";
    if (canManageDrafts) return "drafts";
    if (canSchedule)     return "scheduled";
    if (canViewHistory)  return "history";
    return null;
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab);
  const [draftCount, setDraftCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingDraft, setEditingDraft] = useState(null);

  const refreshLists = () => setRefreshTrigger((v) => v + 1);

  const handleEditDraft = (draft) => {
    if (!canSend) return;
    setEditingDraft(draft);
    setActiveTab("create");
  };

  // If the admin has no access to any tab at all, show the no-permission screen
  if (!canSend && !canManageDrafts && !canSchedule && !canViewHistory) {
    return <NoPermission />;
  }

  // Only build tabs the admin can actually use
  const tabs = [
    canSend && {
      id: "create",
      label: "Create New",
      expandedLabel: "Create New Broadcast",
      icon: Plus,
    },
    canManageDrafts && {
      id: "drafts",
      label: "Drafts",
      expandedLabel: "Saved Drafts",
      icon: Archive,
      count: draftCount,
    },
    canSchedule && {
      id: "scheduled",
      label: "Scheduled",
      expandedLabel: "Scheduled Broadcasts",
      icon: Calendar,
      count: scheduledCount,
    },
    canViewHistory && {
      id: "history",
      label: "History",
      expandedLabel: "Broadcast History",
      icon: History,
    },
  ].filter(Boolean);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#05015A] flex items-center justify-center">
            <Megaphone size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              In-App Broadcast
            </h1>
            <p className="text-xs text-gray-500">
              Send announcements to users
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex-shrink-0 flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== "create") setEditingDraft(null);
                  setActiveTab(tab.id);
                }}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white text-[#05015A] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon size={16} className="flex-shrink-0" />
                <span className="whitespace-nowrap overflow-hidden transition-all duration-200">
                  {isActive ? tab.expandedLabel : tab.label}
                </span>
                {tab.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${
                      tab.id === "drafts"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {activeTab === "create" && canSend && (
          <CreateBroadcastForm
            editDraft={editingDraft}
            onSuccess={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab(canViewHistory ? "history" : "create");
            }}
            onDraftSaved={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab(canManageDrafts ? "drafts" : "create");
            }}
            onScheduled={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab(canSchedule ? "scheduled" : "create");
            }}
          />
        )}

        {activeTab === "drafts" && canManageDrafts && (
          <DraftsList
            refreshTrigger={refreshTrigger}
            onCountChange={setDraftCount}
            // Only allow edit if admin can also send
            onEdit={canSend ? handleEditDraft : undefined}
          />
        )}

        {activeTab === "scheduled" && canSchedule && (
          <ScheduledList
            refreshTrigger={refreshTrigger}
            onCountChange={setScheduledCount}
          />
        )}

        {activeTab === "history" && canViewHistory && (
          <HistoryList refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
};

export default InAppBroadcastPage;