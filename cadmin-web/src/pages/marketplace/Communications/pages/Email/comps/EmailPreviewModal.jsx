// src/pages/Communications/pages/Broadcast/Email/comps/EmailPreviewModal.jsx

import { X, Users, Building2, Mail } from "lucide-react";

// Helper function to ensure correct URL format
const getFileUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;

  const baseURL = import.meta.env.VITE_API_URL;
  return `${baseURL}/api/files/email_attachments/${filename}`;
};

function EmailPreviewModal({ data, formData, onClose }) {
  // Get inline image URL with proper format
  const getInlineImageUrl = () => {
    if (!formData.inline_image) return null;
    
    // If URL exists and is valid, use it
    if (formData.inline_image.url) {
      if (formData.inline_image.url.startsWith("http")) {
        return formData.inline_image.url;
      }
      return formData.inline_image.url;
    }
    
    // Otherwise construct from filename
    if (formData.inline_image.filename) {
      return getFileUrl(formData.inline_image.filename);
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
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
            {/* Left: Email Preview */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Email Preview
              </h4>

              <div className="bg-gray-100 rounded-lg p-4">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Email Header */}
                  <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-4 py-3">
                    <div className="flex items-center gap-2 text-white">
                      <Mail size={16} />
                      <span className="font-semibold text-sm truncate">
                        {formData.subject || "No subject"}
                      </span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-2">
                      Hi [Recipient Name],
                    </p>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {formData.message_text || "No message"}
                    </div>

                    {/* Inline Image */}
                    {formData.inline_image && (
                      <div className="mt-3 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={getInlineImageUrl()}
                          alt="Inline"
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            console.error("Preview image failed to load");
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Action Button */}
                    {formData.action_url && formData.action_label && (
                      <div className="mt-3">
                        <span className="inline-block px-4 py-2 bg-[#05015A] text-white text-xs font-medium rounded-lg">
                          {formData.action_label}
                        </span>
                      </div>
                    )}

                    {/* Attachments */}
                    {formData.attachments?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                          Attachments
                        </p>
                        <div className="space-y-1">
                          {formData.attachments.map((att, i) => (
                            <div key={i} className="text-xs text-gray-600">
                              📎 {att.original_name || att.filename}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400">
                    Unsubscribe from broadcast emails
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Audience Summary */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Audience Summary
              </h4>

              {/* Total */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Users size={24} className="text-indigo-600" />
                  <div>
                    <p className="text-2xl font-bold text-indigo-700">
                      {(
                        data.total_after_unsubscribe ||
                        data.total ||
                        0
                      ).toLocaleString()}
                    </p>
                    <p className="text-sm text-indigo-600">Recipients</p>
                  </div>
                </div>
                {data.unsubscribed_count > 0 && (
                  <p className="text-xs text-indigo-500 mt-2">
                    ({data.unsubscribed_count} unsubscribed excluded)
                  </p>
                )}
              </div>

              {/* By Type */}
              {data.by_type && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-900">
                      {data.by_type.users || 0}
                    </p>
                    <p className="text-xs text-gray-500">Shop Owners</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-900">
                      {data.by_type.cadmins || 0}
                    </p>
                    <p className="text-xs text-gray-500">CAdmins</p>
                  </div>
                </div>
              )}

              {/* By Shop */}
              {data.by_shop && Object.keys(data.by_shop).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    By Shop ({Object.keys(data.by_shop).length})
                  </p>
                  <div className="space-y-1">
                    {Object.entries(data.by_shop)
                      .slice(0, 8)
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
                    {Object.keys(data.by_shop).length > 8 && (
                      <p className="text-xs text-gray-400 italic">
                        +{Object.keys(data.by_shop).length - 8} more
                      </p>
                    )}
                  </div>
                </div>
              )}
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

export default EmailPreviewModal;