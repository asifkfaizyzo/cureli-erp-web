// cadmin-web/src/pages/MasterMedicines/comps/VariantLinkedModal.jsx (do not remove this comment)
import { useEffect } from "react";
import {
  X,
  Link2,
  Store,
  Calendar,
  Package,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

const VariantLinkedModal = ({ isOpen, variant, linkedData = [], onClose }) => {
  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !variant) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Link2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">Linked Shop Medicines</h2>
                <p className="text-white/80 text-sm truncate max-w-md">
                  {variant.name}
                </p>
                <p className="text-white/60 text-xs font-mono mt-1">SKU: {variant.skuId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-blue-600" />
            <div>
              <p className="text-xs text-blue-600">Total Linked</p>
              <p className="text-lg font-bold text-blue-900">{linkedData.length}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <Store size={16} className="text-green-600" />
            <div>
              <p className="text-xs text-green-600">Unique Shops</p>
              <p className="text-lg font-bold text-green-900">
                {[...new Set(linkedData.map((l) => l.shopId))].length}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {linkedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Link2 size={48} className="mb-3 opacity-50" />
              <p className="text-lg font-medium">No Linked Medicines</p>
              <p className="text-sm">This variant has no shop medicines linked to it</p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedData.map((linked) => (
                <div
                  key={linked.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Store size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{linked.originalName}</h4>
                      <p className="text-sm text-gray-500 font-mono mt-0.5">
                        {linked.normalizedName}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600">{linked.shopName}</span>
                        {linked.manufacturer && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{linked.manufacturer}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            linked.linkedBy === "System"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {linked.linkedBy}
                        </span>
                        {linked.linkedAt && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(linked.linkedAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      title="View Shop Details"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium
                         hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantLinkedModal;