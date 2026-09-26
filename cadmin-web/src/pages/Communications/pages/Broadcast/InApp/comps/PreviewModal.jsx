// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/PreviewModal.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/InApp/comps/PreviewModal.jsx

import {
  X,
  Users,
  Building2,
  UserCheck,
  Image,
  Video,
  Link2,
  ExternalLink,
} from "lucide-react";

//  UPDATED: Helper function to ensure correct URL format
const ensureFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;

  const baseURL = import.meta.env.VITE_API_URL;
  return `${baseURL}${url.startsWith("/") ? "" : "/"}${url}`;
};

function PreviewModal({ data, formData, onClose }) {
  const attachment =
    formData.attachments?.length > 0 ? formData.attachments[0] : null;

  const getPriorityBadge = (priority) => {
    const styles = {
      low: "bg-blue-100 text-blue-700",
      normal: "bg-green-100 text-green-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    };
    return styles[priority] || styles.normal;
  };

  const getAttachmentIcon = (type) => {
    switch (type) {
      case "image":
        return <Image size={16} className="text-green-600" />;
      case "video":
        return <Video size={16} className="text-purple-600" />;
      case "link":
        return <Link2 size={16} className="text-blue-600" />;
      default:
        return <Link2 size={16} className="text-gray-600" />;
    }
  };

  //  UPDATED: Get attachment URL with proper format
  const getAttachmentUrl = () => {
    if (!attachment) return null;
    return ensureFullUrl(attachment.url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Broadcast Preview
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Message Preview */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Message Preview
              </h4>

              {/* Notification card mockup */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityBadge(formData.priority)}`}
                        >
                          {formData.priority}
                        </span>
                      </div>
                      <h5 className="font-semibold text-gray-900">
                        {formData.title || "Untitled"}
                      </h5>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                        {formData.message || "No message"}
                      </p>
                    </div>
                  </div>

                  {/* Attachment preview */}
                  {attachment && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {attachment.type === "image" && getAttachmentUrl() ? (
                        <div className="rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={getAttachmentUrl()}
                            alt="Attachment"
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          {getAttachmentIcon(attachment.type)}
                          <span className="text-sm text-gray-700 truncate flex-1">
                            {attachment.label ||
                              attachment.original_name ||
                              "Attachment"}
                          </span>
                          {attachment.type !== "image" && (
                            <ExternalLink size={14} className="text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action button preview */}
                  {formData.action_url && formData.action_label && (
                    <div className="mt-3">
                      <button className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg">
                        {formData.action_label}
                      </button>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
                  Just now
                </div>
              </div>
            </div>

            {/* Right: Audience Summary */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Audience Summary
              </h4>

              <div className="space-y-3">
                {/* Total recipients */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Users size={24} className="text-indigo-600" />
                    <div>
                      <p className="text-2xl font-bold text-indigo-700">
                        {data.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-indigo-600">
                        Total Recipients
                      </p>
                    </div>
                  </div>
                </div>

                {/* By type */}
                {data.by_type && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-lg font-semibold text-gray-900">
                        {data.by_type.users}
                      </p>
                      <p className="text-xs text-gray-500">ERP Users</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-lg font-semibold text-gray-900">
                        {data.by_type.cadmins}
                      </p>
                      <p className="text-xs text-gray-500">CAdmins</p>
                    </div>
                  </div>
                )}

                {/* By role */}
                {data.by_role && Object.keys(data.by_role).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      By Role
                    </p>
                    <div className="space-y-1">
                      {Object.entries(data.by_role).map(([role, count]) => (
                        <div
                          key={role}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700 capitalize">
                            {role.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium text-gray-900">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By shop */}
                {data.by_shop && Object.keys(data.by_shop).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      By Shop ({Object.keys(data.by_shop).length} shops)
                    </p>
                    <div className="space-y-1">
                      {Object.entries(data.by_shop)
                        .slice(0, 10)
                        .map(([shopId, info]) => (
                          <div
                            key={shopId}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700 truncate flex-1">
                              {info.name || shopId.slice(0, 8)}
                            </span>
                            <span className="font-medium text-gray-900 ml-2">
                              {info.count}
                            </span>
                          </div>
                        ))}
                      {Object.keys(data.by_shop).length > 10 && (
                        <p className="text-xs text-gray-400 italic">
                          +{Object.keys(data.by_shop).length - 10} more shops
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewModal;
