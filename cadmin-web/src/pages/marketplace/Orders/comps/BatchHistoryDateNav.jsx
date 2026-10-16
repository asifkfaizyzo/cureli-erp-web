// cadmin-web/src/pages/marketplace/Orders/comps/BatchHistoryDateNav.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import StyledDateFilter from "../../../../components/common/StyledDateFilter";

function getISTDateString(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

function shiftDateString(dateStr, deltaDays) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return getISTDateString(d);
}

/**
 * Single-date swipeable nav bar for Batch History.
 * [◀] [📅 date] [▶] — ▶ disabled once date === today (no future dates).
 *
 * The center element IS the existing StyledDateFilter component, reused
 * as-is including its own built-in trigger button + calendar popover —
 * we do NOT wrap it in a second custom trigger/open-state (that was a
 * bug in an earlier draft: StyledDateFilter owns its own `isOpen` state
 * internally and only responds to clicks on its own button).
 *
 * StyledDateFilter already works on "YYYY-MM-DD" strings (see its
 * handleDateClick/formatDateDisplay), matching our date state exactly —
 * no Date<->string conversion needed at this boundary.
 */
const BatchHistoryDateNav = ({ date, onDateChange }) => {
  const today = getISTDateString();
  const isToday = date === today;

  const handleFilterChange = (newDateStr) => {
    // StyledDateFilter's "Clear" (X) button calls setDate("") — Batch
    // History has no "no date" state, so clearing snaps back to today.
    if (!newDateStr) {
      onDateChange(today);
      return;
    }
    // Guard against picking a future date from the calendar grid —
    // StyledDateFilter itself has no max-date restriction built in.
    onDateChange(newDateStr > today ? today : newDateStr);
  };

  return (
    <div className="flex items-center justify-center gap-2 py-3 border-b border-gray-100">
      <button
        onClick={() => onDateChange(shiftDateString(date, -1))}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#05015A] transition-colors flex-shrink-0"
        title="Previous day"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="w-48 flex-shrink-0">
        <StyledDateFilter
          date={date}
          setDate={handleFilterChange}
          formatLabel={(d) => (d === today ? "Today" : undefined)}
        />
      </div>

      <button
        onClick={() => onDateChange(shiftDateString(date, 1))}
        disabled={isToday}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#05015A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        title={isToday ? "Cannot go beyond today" : "Next day"}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default BatchHistoryDateNav;