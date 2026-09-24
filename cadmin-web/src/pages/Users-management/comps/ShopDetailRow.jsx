// cadmin-web/src/pages/Users-management/comps/ShopDetailRow.jsx (do not remove this comment)
import { Pencil, ClipboardCopy } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const ShopDetailRow = ({ label, value, isEditing }) => {
  const textareaRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing, value]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-4 py-2 group">
      {/* Label */}
      <label className="w-32 text-sm font-medium text-gray-500 flex-shrink-0">
        {label}
      </label>

      {/* Field */}
      <div className="flex-1 relative">
        {!isEditing ? (
          <input
            type="text"
            value={value}
            readOnly
            className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm 
                       bg-white border border-gray-200 text-gray-700 cursor-default"
          />
        ) : (
          <textarea
            ref={textareaRef}
            defaultValue={value}
            className="
              w-full px-4 py-2.5 pr-8 rounded-lg text-sm resize-none overflow-hidden
              bg-white border-2 border-indigo-500 text-gray-900 shadow-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            "
          />
        )}

        {/* Right-side icon */}
        {!isEditing ? (
          <button
            onClick={handleCopy}
            className="
              absolute right-3 top-1/2 -translate-y-1/2 opacity-0
              group-hover:opacity-100 transition-opacity duration-150
              text-gray-400 hover:text-indigo-500
            "
          >
            <ClipboardCopy size={16} />
          </button>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Pencil size={14} className="text-indigo-400" />
          </div>
        )}
      </div>

      {/* Copied feedback (optional small UI) */}
      {copied && (
        <span className="text-xs text-green-600 ml-2">Copied</span>
      )}
    </div>
  );
};

export default ShopDetailRow;
