// cadmin-web/src/pages/Fleet/Payouts/comps/AttendanceCalendarTab.jsx (do not remove this comment)
import { Clock, Package } from "lucide-react";

const AttendanceCalendarTab = ({ payout }) => {
  const attendance = payout?.breakdown_snapshot?.attendance;

  if (!attendance) {
    return <p className="text-sm text-gray-400">No attendance data available. Click refresh to load.</p>;
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Days Active</p>
          <p className="text-lg font-bold">{attendance.days_active}/7</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Total Hours</p>
          <p className="text-lg font-bold">{attendance.total_hours}h</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-lg font-bold">{attendance.total_orders}</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {attendance.daily?.map((day) => {
          const isActive = day.online_hours > 0;
          return (
            <div
              key={day.date}
              className={`p-2 rounded-lg border text-center ${isActive ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-100 opacity-50"}`}
            >
              <p className="text-xs font-bold text-gray-700">{day.day_name}</p>
              <p className="text-[10px] text-gray-400">{day.date.slice(5)}</p>
              <div className="mt-1 flex flex-col items-center gap-0.5">
                <span className="flex items-center gap-0.5 text-xs text-gray-600">
                  <Clock size={10} />{day.online_hours}h
                </span>
                <span className="flex items-center gap-0.5 text-xs text-gray-600">
                  <Package size={10} />{day.orders}
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