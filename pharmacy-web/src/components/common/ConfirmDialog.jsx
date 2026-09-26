// pharmacy-web/src/components/common/ConfirmDialog.jsx (do not remove this comment)
//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\cadmin-web\src\components\common\ConfirmDialog.jsx

import { AlertTriangle, CheckCircle, Mail, Trash2 } from "lucide-react";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger | warning | success | info
  loading = false,
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: "bg-red-100 text-red-600",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: "bg-orange-100 text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
    },
    success: {
      icon: "bg-emerald-100 text-emerald-600",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    info: {
      icon: "bg-blue-100 text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const styles = typeStyles[type] || typeStyles.danger;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full ${styles.icon} flex items-center justify-center mx-auto mb-4`}
        >
          {type === "danger" && <Trash2 size={24} />}
          {type === "warning" && <AlertTriangle size={24} />}
          {type === "success" && <CheckCircle size={24} />}
          {type === "info" && <Mail size={24} />}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <div className="text-gray-600 text-center mb-6">{message}</div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 
                       font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all 
                       disabled:opacity-50 flex items-center justify-center gap-2 ${styles.button}`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
