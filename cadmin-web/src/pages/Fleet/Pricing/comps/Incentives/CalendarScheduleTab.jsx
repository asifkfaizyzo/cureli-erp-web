// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/CalendarScheduleTab.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/CalendarScheduleTab.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Star, Loader2, Plus } from "lucide-react";

import {
  getCalendarSchedule, assignSchedule, deleteSchedule, getIncentiveTemplates,
} from "../../../../../api/cadminFleetIncentives";
import { useToast } from "../../../../../components/common/Toast";
import AssignTemplateModal from "./AssignTemplateModal";

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function scheduleCoversDate(schedule, date) {
  const dateStr = toDateStr(date);
  return schedule.start_date <= dateStr && schedule.end_date >= dateStr;
}

export default function CalendarScheduleTab() {
  const toast = useToast();
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const monthStart = useMemo(() => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1), [monthCursor]);
  const monthEnd = useMemo(() => new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0), [monthCursor]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch a wider window that covers visible calendar cells (including prev/next month spillover)
      const gridStart = new Date(monthStart);
      gridStart.setDate(gridStart.getDate() - gridStart.getDay());
      const gridEnd = new Date(monthEnd);
      gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

      const [tpl, sch] = await Promise.all([
        getIncentiveTemplates(),
        getCalendarSchedule({
          start_date: toDateStr(gridStart),
          end_date: toDateStr(gridEnd),
        }),
      ]);

      setTemplates(tpl.data.data || []);
      setSchedules(sch.data.data || []);
    } catch (err) {
      toast.error("Load Failed", err.response?.data?.message || "Could not load calendar");
    } finally {
      setLoading(false);
    }
  }, [monthStart, monthEnd, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calendarCells = useMemo(() => {
    const cells = [];
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      cells.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  }, [monthStart, monthEnd]);

  const getSchedulesForDate = (date) => {
    return schedules.filter((s) => scheduleCoversDate(s, date));
  };

  const openDay = (date) => {
    setSelectedDate(toDateStr(date));
    setShowModal(true);
  };

  const handleAssign = async (payload) => {
    try {
      setBusy(true);
      await assignSchedule(payload);
      toast.success("Assigned", "Template assigned successfully");
      await fetchData();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not assign template");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (schedule) => {
    try {
      setBusy(true);
      await deleteSchedule(schedule.schedule_id);
      toast.success("Removed", "Scheduled assignment removed");
      await fetchData();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not remove assignment");
    } finally {
      setBusy(false);
    }
  };

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  const selectedDateSchedules = selectedDate
    ? schedules.filter((s) => s.start_date <= selectedDate && s.end_date >= selectedDate)
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Calendar Schedule</p>
          <p className="text-xs text-gray-500 mt-0.5">Assign templates to specific dates or multi-day ranges</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setMonthCursor(new Date())}
            className="px-3 py-1.5 text-xs font-medium text-[#05015A] bg-[#05015A]/8 hover:bg-[#05015A]/12 rounded-lg">
            Today
          </button>
          <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">{monthLabel}</h3>
          {loading && <Loader2 size={14} className="animate-spin text-[#05015A]" />}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarCells.map((date, i) => {
            const isCurrentMonth = date.getMonth() === monthCursor.getMonth();
            const isToday = isSameDay(date, today);
            const daySchedules = getSchedulesForDate(date);
            const hasFeatured = daySchedules.some((s) => s.is_featured);

            return (
              <button
                key={i}
                onClick={() => openDay(date)}
                className={`min-h-[100px] p-2 text-left border-r border-b border-gray-100 hover:bg-[#05015A]/3 transition-colors relative
                  ${!isCurrentMonth ? "bg-gray-50/50" : "bg-white"}
                  ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
                    ${isToday ? "bg-[#05015A] text-white" : isCurrentMonth ? "text-gray-700" : "text-gray-400"}`}>
                    {date.getDate()}
                  </span>
                  {hasFeatured && (
                    <Star size={10} className="text-amber-500" fill="currentColor" />
                  )}
                </div>

                <div className="space-y-1">
                  {daySchedules.slice(0, 2).map((s) => (
                    <div key={s.schedule_id}
                      className={`px-1.5 py-1 rounded text-[9px] font-medium leading-tight truncate
                        ${s.is_featured
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : s.period_type === "WEEKLY"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"}`}>
                      {s.template_title}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <p className="text-[9px] text-gray-500 px-1.5">+{daySchedules.length - 2} more</p>
                  )}
                  {daySchedules.length === 0 && isCurrentMonth && (
                    <div className="opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center py-2">
                      <Plus size={12} className="text-gray-300" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
          <span className="text-[10px] text-gray-500">Daily Quest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" />
          <span className="text-[10px] text-gray-500">Weekly Quest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200 flex items-center justify-center">
            <Star size={7} className="text-amber-600" fill="currentColor" />
          </div>
          <span className="text-[10px] text-gray-500">Featured / Holiday Special</span>
        </div>
      </div>

      <AssignTemplateModal
        open={showModal}
        date={selectedDate}
        templates={templates}
        existingSchedules={selectedDateSchedules}
        onClose={() => { setShowModal(false); setSelectedDate(null); }}
        onSubmit={handleAssign}
        onDelete={handleDelete}
        saving={busy}
      />
    </div>
  );
}