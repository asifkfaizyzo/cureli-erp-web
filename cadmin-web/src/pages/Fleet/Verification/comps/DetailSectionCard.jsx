// cadmin-web/src/pages/Fleet/Verification/comps/DetailSectionCard.jsx

import { Lock } from "lucide-react";

/**
 * Read-only detail section wrapper.
 * Displays personal/location/vehicle info without approve/reject controls.
 * Text-section rejection is deferred — this is view-only for now.
 */
const DetailSectionCard = ({ icon: Icon, title, fields = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          {Icon && <Icon size={14} className="text-indigo-600" />}
          {title}
        </h3>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400">
          <Lock size={10} /> Read-only
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map((field, idx) => (
          <InfoItem key={idx} {...field} />
        ))}
      </div>
    </div>
  );
};

function InfoItem({ label, value, mono, multiline }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`text-xs font-semibold text-gray-800 ${
          mono ? "font-mono tracking-wide" : ""
        } ${multiline ? "leading-relaxed break-words" : "truncate"}`}
      >
        {value || <span className="text-gray-300 italic font-normal">—</span>}
      </p>
    </div>
  );
}

export default DetailSectionCard;