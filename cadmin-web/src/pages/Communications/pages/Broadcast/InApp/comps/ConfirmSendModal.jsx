// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/ConfirmSendModal.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/InApp/comps/ConfirmSendModal.jsx

import { AlertTriangle, Send, X, Users, Image, Video, Link2, FileText } from "lucide-react";

function ConfirmSendModal({ 
  title, 
  message, 
  recipientCount, 
  recipientBreakdown,
  attachments = [],
  onConfirm, 
  onCancel 
}) {
  const attachment = attachments.length > 0 ? attachments[0] : null;

  const getAttachmentIcon = (type) => {
    switch (type) {
      case 'image': return <Image size={14} className="text-green-600" />;
      case 'video': return <Video size={14} className="text-purple-600" />;
      case 'link': return <Link2 size={14} className="text-blue-600" />;
      default: return <FileText size={14} className="text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Confirm Send</h3>
          </div>
          <button 
            onClick={onCancel}
            className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Warning message */}
          <p className="text-sm text-gray-600">
            You are about to send this broadcast immediately. This action cannot be undone.
          </p>

          {/* Broadcast summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{title}</p>
            </div>
            
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message Preview</span>
              <p className="text-sm text-gray-700 mt-0.5 line-clamp-3">{message}</p>
            </div>

            {/* Attachment info */}
            {attachment && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Attachment</span>
                <div className="flex items-center gap-2 mt-1">
                  {getAttachmentIcon(attachment.type)}
                  <span className="text-sm text-gray-700 truncate">
                    {attachment.label || attachment.original_name || 'Attached file'}
                  </span>
                  {attachment.size_formatted && (
                    <span className="text-xs text-gray-400">({attachment.size_formatted})</span>
                  )}
                </div>
              </div>
            )}

            {/* Recipient count */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700">
                  {recipientCount.toLocaleString()} recipients
                </span>
              </div>
              {recipientBreakdown && (
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  {recipientBreakdown.users} users, {recipientBreakdown.cadmins} admins
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#0a0280] transition-colors"
          >
            <Send size={16} />
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmSendModal;