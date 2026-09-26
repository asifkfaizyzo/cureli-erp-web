// cadmin-web/src/pages/shops-management/comps/tabs/ShopActivityTab.jsx (do not remove this comment)
// src/components/Shops/tabs/ShopActivityTab.jsx

import {
  History,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Upload,
  User,
} from "lucide-react";

const ShopActivityTab = ({ shop }) => {
  // Use verification logs from API, or dummy data
  const verificationLogs = shop?.verificationLogs || [];
  
  // Dummy activity data for demonstration
  const dummyActivity = [
    {
      id: 1,
      action: "document_verified",
      description: "Drug License was verified",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      actor: "Admin User",
    },
    {
      id: 2,
      action: "document_rejected",
      description: "GST Certificate was rejected - Blurry image",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      actor: "Admin User",
    },
    {
      id: 3,
      action: "document_uploaded",
      description: "GST Certificate was re-uploaded",
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      actor: "Shop Owner",
    },
    {
      id: 4,
      action: "shop_created",
      description: "Shop was registered",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      actor: "System",
    },
    {
      id: 5,
      action: "subscription_activated",
      description: "Premium plan subscription activated",
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      actor: "System",
    },
  ];

  // Combine verification logs with dummy data
  const activities = verificationLogs.length > 0 
    ? verificationLogs.map(log => ({
        id: log.id || log.log_id,
        action: log.action,
        description: log.notes || log.description || `${log.action} performed`,
        created_at: log.created_at,
        actor: log.verified_by || "Admin",
      }))
    : dummyActivity;

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (action) => {
    const actionLower = action?.toLowerCase() || "";
    
    if (actionLower.includes("verified") || actionLower.includes("approved")) {
      return { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" };
    }
    if (actionLower.includes("rejected")) {
      return { icon: XCircle, color: "text-red-500", bg: "bg-red-50" };
    }
    if (actionLower.includes("uploaded") || actionLower.includes("resubmit")) {
      return { icon: Upload, color: "text-blue-500", bg: "bg-blue-50" };
    }
    if (actionLower.includes("pending")) {
      return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50" };
    }
    if (actionLower.includes("subscription")) {
      return { icon: RefreshCw, color: "text-purple-500", bg: "bg-purple-50" };
    }
    if (actionLower.includes("created") || actionLower.includes("registered")) {
      return { icon: FileText, color: "text-indigo-500", bg: "bg-indigo-50" };
    }
    return { icon: History, color: "text-gray-500", bg: "bg-gray-50" };
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <History size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No activity recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <History size={16} />
          Activity Log ({activities.length})
        </h3>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const { icon: Icon, color, bg } = getActivityIcon(activity.action);
          
          return (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{activity.actor}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopActivityTab;