// cadmin-web/src/pages/marketplace/Communications/pages/Email/MobileEmailBroadcastPage.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Communications/pages/Email/MobileEmailBroadcastPage.jsx

import { useState } from "react";
import { Mail, Archive, Calendar, History, Plus } from "lucide-react";
import CreateMobileEmailForm from "./comps/CreateMobileEmailForm";
import EmailDraftsList from "../../../../Communications/pages/Broadcast/Email/comps/EmailDraftsList";
import EmailScheduledList from "../../../../Communications/pages/Broadcast/Email/comps/EmailScheduledList";
import EmailHistoryList from "../../../../Communications/pages/Broadcast/Email/comps/EmailHistoryList";
import { useCAdminPermission } from "../../../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../../../config/cadminPermissions";
import NoPermission from "../../../../../components/common/NoPermission";

const MobileEmailBroadcastPage = () => {
  const { hasPermission } = useCAdminPermission();
  const canSend = hasPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND);

  const [activeTab, setActiveTab] = useState("create");
  const [draftCount, setDraftCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingDraft, setEditingDraft] = useState(null);

  if (!canSend) return <NoPermission />;

  const refreshLists = () => setRefreshTrigger((v) => v + 1);

  const handleEditDraft = (draft) => {
    setEditingDraft(draft);
    setActiveTab("create");
  };

  const tabs = [
    { id: "create", label: "Create", expandedLabel: "Compose Customer Email", icon: Plus },
    { id: "drafts", label: "Drafts", expandedLabel: "Saved Drafts", icon: Archive, count: draftCount },
    { id: "scheduled", label: "Scheduled", expandedLabel: "Scheduled", icon: Calendar, count: scheduledCount },
    { id: "history", label: "History", expandedLabel: "Sent History", icon: History },
  ];

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#05015A] flex items-center justify-center">
            <Mail size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customer Email Broadcast</h1>
            <p className="text-xs text-gray-500">Send custom emails to mobile app customers</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== "create") setEditingDraft(null);
                  setActiveTab(tab.id);
                }}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive ? "bg-white text-[#05015A] shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon size={16} />
                <span>{isActive ? tab.expandedLabel : tab.label}</span>
                {tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {activeTab === "create" && (
          <CreateMobileEmailForm
            editDraft={editingDraft}
            onSuccess={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab("history");
            }}
            onDraftSaved={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab("drafts");
            }}
            onScheduled={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab("scheduled");
            }}
          />
        )}
        {activeTab === "drafts" && (
          <EmailDraftsList
            refreshTrigger={refreshTrigger}
            onCountChange={setDraftCount}
            onEdit={handleEditDraft}
          />
        )}
        {activeTab === "scheduled" && (
          <EmailScheduledList
            refreshTrigger={refreshTrigger}
            onCountChange={setScheduledCount}
            onCancelled={refreshLists}
          />
        )}
        {activeTab === "history" && (
          <EmailHistoryList refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
};

export default MobileEmailBroadcastPage;