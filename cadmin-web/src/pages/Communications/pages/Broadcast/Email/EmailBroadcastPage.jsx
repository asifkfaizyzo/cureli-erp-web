// cadmin-web/src/pages/Communications/pages/Broadcast/Email/EmailBroadcastPage.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/Email/EmailBroadcastPage.jsx

import { useState, useEffect } from "react";
import {
  Mail,
  Archive,
  Calendar,
  History,
  Plus,
  Users,
  AlertCircle,
} from "lucide-react";
import CreateEmailForm from "./comps/CreateEmailForm";
import EmailDraftsList from "./comps/EmailDraftsList";
import EmailScheduledList from "./comps/EmailScheduledList";
import EmailHistoryList from "./comps/EmailHistoryList";
import UnsubscribeListModal from "./comps/UnsubscribeListModal";
import * as emailBroadcastAPI from "../../../../../api/cadminEmailBroadcast";
import { useCAdminPermission } from "../../../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../../../config/cadminPermissions";
import NoPermission from "../../../../../components/common/NoPermission";

const EmailBroadcastPage = () => {
  // ── Permission gates ─────────────────────────────────────────────────────
  const { hasPermission } = useCAdminPermission();
  const canSend           = hasPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND);
  const canManageDrafts   = hasPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS);
  const canSchedule       = hasPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE);
  const canViewHistory    = hasPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY);
  const canManageUnsubs   = hasPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES);

  // Derive the default tab based on what the admin can actually access
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
  const [quota, setQuota] = useState(null);
  const [unsubscribeCount, setUnsubscribeCount] = useState(0);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);

  const refreshLists = () => setRefreshTrigger((v) => v + 1);

  useEffect(() => {
    if (canSend) loadQuota();
    if (canManageUnsubs) loadUnsubscribeCount();
  }, [canSend, canManageUnsubs]);

  const loadQuota = async () => {
    try {
      const res = await emailBroadcastAPI.getQuotaStatus();
      if (res && res.success) {
        setQuota(res.data);
      } else if (res && res.remaining !== undefined) {
        setQuota(res);
      }
    } catch (err) {
      console.error("Failed to load quota:", err);
    }
  };

  const loadUnsubscribeCount = async () => {
    try {
      const res = await emailBroadcastAPI.getUnsubscribeCount();
      if (res && res.success) {
        setUnsubscribeCount(res.data?.count || 0);
      } else if (res && res.count !== undefined) {
        setUnsubscribeCount(res.count || 0);
      }
    } catch (err) {
      console.error("Failed to load unsubscribe count:", err);
    }
  };

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
      label: "Create",
      expandedLabel: "Create Email",
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
      expandedLabel: "Scheduled Emails",
      icon: Calendar,
      count: scheduledCount,
    },
    canViewHistory && {
      id: "history",
      label: "History",
      expandedLabel: "Send History",
      icon: History,
    },
  ].filter(Boolean); // remove falsy entries

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#05015A] flex items-center justify-center">
            <Mail size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Broadcast</h1>
            <p className="text-xs text-gray-500">
              Send emails to shop owners & admins
            </p>
          </div>
        </div>

        {/* Quota & Unsubscribe Info */}
        <div className="flex items-center gap-4">
          {/* Quota Display — only if admin can send */}
          {canSend && quota && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div className="text-right">
                <p className="text-xs text-gray-500">Today's Quota</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(quota.remaining || 0).toLocaleString()} /{" "}
                  {(quota.limit || 0).toLocaleString()}
                </p>
              </div>
              <div
                className={`w-2 h-8 rounded-full ${
                  (quota.usage_percent || 0) > 90
                    ? "bg-red-500"
                    : (quota.usage_percent || 0) > 70
                      ? "bg-amber-500"
                      : "bg-green-500"
                }`}
              />
            </div>
          )}

          {/* Unsubscribe Button — only if admin can manage unsubscribes */}
          {canManageUnsubs && (
            <button
              onClick={() => setShowUnsubscribeModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users size={16} />
              <span>Unsubscribes</span>
              {unsubscribeCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-100 rounded-full">
                  {unsubscribeCount}
                </span>
              )}
            </button>
          )}

          {/* Tab Switcher */}
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
      </div>

      {/* Quota Warning — only if admin can send */}
      {canSend && quota && quota.remaining < 100 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={16} className="text-amber-600" />
          <span className="text-sm text-amber-700">
            Low quota remaining ({quota.remaining} emails). Campaigns may be
            paused and resumed tomorrow.
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {activeTab === "create" && canSend && (
          <CreateEmailForm
            editDraft={editingDraft}
            onSuccess={() => {
              setEditingDraft(null);
              refreshLists();
              loadQuota();
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
            quota={quota}
          />
        )}

        {activeTab === "drafts" && canManageDrafts && (
          <EmailDraftsList
            refreshTrigger={refreshTrigger}
            onCountChange={setDraftCount}
            // Only allow edit (which opens create tab) if admin can send
            onEdit={canSend ? handleEditDraft : undefined}
          />
        )}

        {activeTab === "scheduled" && canSchedule && (
          <EmailScheduledList
            refreshTrigger={refreshTrigger}
            onCountChange={setScheduledCount}
            onCancelled={refreshLists}
          />
        )}

        {activeTab === "history" && canViewHistory && (
          <EmailHistoryList
            refreshTrigger={refreshTrigger}
            onRetry={() => {
              refreshLists();
              if (canSend) loadQuota();
            }}
          />
        )}
      </div>

      {/* Unsubscribe Modal — only mounted if admin can manage unsubscribes */}
      {canManageUnsubs && showUnsubscribeModal && (
        <UnsubscribeListModal
          onClose={() => {
            setShowUnsubscribeModal(false);
            loadUnsubscribeCount();
          }}
        />
      )}
    </div>
  );
};

export default EmailBroadcastPage;