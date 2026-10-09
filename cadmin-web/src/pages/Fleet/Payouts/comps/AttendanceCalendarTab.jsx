// cadmin-web/src/pages/Fleet/Payouts/comps/AttendanceCalendarTab.jsx (do not remove this comment)
import { useState, useEffect } from "react";
import { Clock, Package, RefreshCw, Loader2, Info } from "lucide-react";
import { getRiderAttendance } from "../../../../api/cadminFleetRiderPayouts";

const AttendanceCalendarTab = ({ payout, riderId, weekStart, onRecalculate, isCalculating }) => {
  const snapshotAttendance = payout?.breakdown_snapshot?.attendance;
  const isMutable = payout?.status === "DRAFT" || payout?.status === "PENDING" || payout?.status === "FAILED";

  const [liveAttendance, setLiveAttendance] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);

  // If attendance was not cached in the payout snapshot, fetch read-only attendance dynamically
  useEffect(() => {
    if (!snapshotAttendance && riderId && weekStart) {
      setLoadingLive(true);
      getRiderAttendance(riderId, weekStart)
        .then((res) => {
          setLiveAttendance(res.data?.data?.attendance || null);
        })
        .catch(() => {
          setLiveAttendance(null);
        })
        .finally(() => {
          setLoadingLive(false);
        });
    }
  }, [snapshotAttendance, riderId, weekStart]);

  const attendance = snapshotAttendance || liveAttendance;

  if (loadingLive) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-xs">Loading attendance details...</p>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <Clock className="text-gray-400 mb-3" size={32} />
        <h4 className="text-sm font-semibold text-gray-900 mb-1">No Attendance Data</h4>
        <p className="text-xs text-gray-500 max-w-sm mb-4">
          {isMutable
            ? "Attendance details and online hours haven't been computed for this week yet."
            : "No online sessions recorded for this past week."}
        </p>
        {isMutable && onRecalculate && (
          <button
            onClick={onRecalculate}
            disabled={isCalculating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#05015A] hover:bg-[#05015A]/90 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={12} className={isCalculating ? "animate-spin" : ""} />
            {isCalculating ? "Computing..." : "Compute Attendance Now"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!snapshotAttendance && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <Info size={14} className="flex-shrink-0" />
          <span>
            Showing live calculated attendance.
            {isMutable && " Click recalculate to save this snapshot to the payout."}
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Days Active</p>
          <p className="text-lg font-bold text-gray-900">{attendance.days_active}/7</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Total Hours</p>
          <p className="text-lg font-bold text-gray-900">{attendance.total_hours}h</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Total Orders</p>
          <p className="text-lg font-bold text-gray-900">{attendance.total_orders}</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {attendance.daily?.map((day) => {
          const isActive = day.online_hours > 0;
          return (
            <div
              key={day.date}
              className={`p-2 rounded-lg border text-center transition-all ${
                isActive
                  ? "bg-indigo-50/50 border-indigo-100 text-indigo-950"
                  : "bg-gray-50/50 border-gray-100 opacity-50"
              }`}
            >
              <p className="text-xs font-bold text-gray-700">{day.day_name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{day.date.slice(5)}</p>
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-gray-600">
                  <Clock size={10} className="text-gray-400" />
                  {day.online_hours}h
                </span>
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-gray-600">
                  <Package size={10} className="text-gray-400" />
                  {day.orders}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceCalendarTab;