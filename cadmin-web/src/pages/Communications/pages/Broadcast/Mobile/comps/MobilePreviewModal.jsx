// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobilePreviewModal.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobilePreviewModal.jsx

import { X, Smartphone, Bell } from 'lucide-react';

const TAP_LABELS = {
  home:                'Home Screen',
  cart:                'Cart',
  product:             'Product Detail',
  category:            'Product Category',
  prescription_upload: 'Prescription Upload',
};

const CATEGORY_COLORS = {
  promotions:            'bg-purple-100 text-purple-700',
  prescription_updates:  'bg-blue-100 text-blue-700',
  system_messages:       'bg-gray-100 text-gray-700',
  cart_abandonment:      'bg-orange-100 text-orange-700',
};

function MobilePreviewModal({ form, audiencePreview, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Push Notification Preview</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="w-72 bg-gray-900 rounded-3xl p-3 shadow-2xl">
              {/* Phone top bar */}
              <div className="flex items-center justify-between px-2 py-1 mb-3">
                <span className="text-white text-[10px]">9:41 AM</span>
                <div className="flex gap-1">
                  <div className="w-3 h-1.5 bg-white rounded-sm opacity-80" />
                  <div className="w-3 h-1.5 bg-white rounded-sm opacity-60" />
                  <div className="w-3 h-1.5 bg-white rounded-sm opacity-40" />
                </div>
              </div>

              {/* Lock screen notification */}
              <div className="bg-white/90 backdrop-blur rounded-2xl p-3 shadow-lg">
                <div className="flex items-start gap-2">
                  {/* App icon */}
                  <div className="w-8 h-8 rounded-lg bg-[#05015A] flex items-center justify-center flex-shrink-0">
                    <Bell size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        Cureli
                      </span>
                      <span className="text-[10px] text-gray-400">now</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5 truncate">
                      {form.title || 'Notification Title'}
                    </p>
                    <p className="text-xs text-gray-600 leading-snug mt-0.5 line-clamp-2">
                      {form.body || 'Notification body text will appear here.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Home bar */}
              <div className="flex justify-center mt-3">
                <div className="w-16 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Category</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                CATEGORY_COLORS[form.category] || 'bg-gray-100 text-gray-700'
              }`}>
                {form.category.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Opens</p>
              <p className="text-sm font-medium text-gray-900">
                {TAP_LABELS[form.tap_action] || form.tap_action}
              </p>
            </div>
            {audiencePreview && (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Total Users</p>
                  <p className="text-xl font-bold text-gray-900">
                    {audiencePreview.total.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-green-600 mb-1">Will Receive Push</p>
                  <p className="text-xl font-bold text-green-700">
                    {audiencePreview.with_push_token.toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobilePreviewModal;