// cadmin-web/src/pages/Fleet/Verification/comps/ReviewProgressBar.jsx

import { CheckCircle2, XCircle, Clock, ListChecks } from "lucide-react";

/**
 * Progress summary bar showing local review decisions vs total docs.
 */
const ReviewProgressBar = ({ total, approved, rejected, pending }) => {
  const reviewed = approved + rejected;
  const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const isComplete = reviewed === total && total > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListChecks
            size={16}
            className={isComplete ? "text-emerald-600" : "text-indigo-600"}
          />
          <span className="text-sm font-bold text-gray-900">
            Review Progress
          </span>
        </div>
        <span
          className={`text-xs font-bold ${
            isComplete ? "text-emerald-700" : "text-indigo-700"
          }`}
        >
          {reviewed} / {total} reviewed
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 ${
            isComplete ? "bg-emerald-500" : "bg-indigo-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span className="text-xs text-gray-600">
            Approved: <strong className="text-gray-900">{approved}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle size={13} className="text-red-500" />
          <span className="text-xs text-gray-600">
            Rejected: <strong className="text-gray-900">{rejected}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-amber-500" />
          <span className="text-xs text-gray-600">
            Awaiting: <strong className="text-gray-900">{pending}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReviewProgressBar;