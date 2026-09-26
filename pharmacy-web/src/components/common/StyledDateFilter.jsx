// pharmacy-web/src/components/common/StyledDateFilter.jsx (do not remove this comment)
// cadmin-web/src/components/common/StyledDateFilter.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const StyledDateFilter = ({ label, date, setDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate position before opening
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, []);

  // Handle opening - calculate position first, then open
  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on scroll and update position on resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => setIsOpen(false);
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

  // Date Logic
  const daysInMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const formatDateDisplay = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDateClick = (day) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - offset * 60 * 1000);
    const dateString = adjustedDate.toISOString().split("T")[0];
    setDate(dateString);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setDate("");
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    );
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }

    for (let i = 1; i <= totalDays; i++) {
      const tempDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i,
      );
      const isSelected =
        date &&
        parseInt(date.split("-")[2]) === i &&
        parseInt(date.split("-")[1]) === currentMonth.getMonth() + 1 &&
        parseInt(date.split("-")[0]) === currentMonth.getFullYear();
      const isToday = new Date().toDateString() === tempDate.toDateString();

      days.push(
        <button
          key={i}
          onClick={() => handleDateClick(i)}
          className={`
            h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all
            ${
              isSelected
                ? "bg-[#05015A] text-white shadow-md scale-105"
                : "text-gray-700 hover:bg-indigo-50 hover:text-[#05015A]"
            }
            ${!isSelected && isToday ? "border border-[#05015A] text-[#05015A] font-bold" : ""}
          `}
        >
          {i}
        </button>,
      );
    }
    return days;
  };

  const isActive = Boolean(date);

  // Only render dropdown when open AND position is calculated
  const dropdown =
    isOpen && dropdownPosition
      ? createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] p-4 w-64 bg-white border border-gray-200 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 mb-2 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <span key={day} className="text-xs font-medium text-gray-400">
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
              {renderCalendar()}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-gray-500 font-medium ml-1">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          className={`
            h-10 pl-10 pr-10 border rounded-lg text-sm text-left 
            flex items-center w-auto min-w-[160px] shadow-sm whitespace-nowrap
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            transition-all duration-200 ease-in-out
            ${
              isActive
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }
          `}
        >
          <CalendarIcon
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors
              ${isActive ? "text-indigo-500" : "text-gray-400"}`}
          />
          <span>{isActive ? formatDateDisplay(date) : "Select Date"}</span>
          {isActive ? (
            <div
              role="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full 
                         hover:bg-indigo-200 text-indigo-500 transition-colors z-10"
            >
              <X size={14} strokeWidth={2.5} />
            </div>
          ) : (
            <ChevronDown
              size={16}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200
                ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>
      </div>

      {/* Dropdown Portal */}
      {dropdown}
    </div>
  );
};

export default StyledDateFilter;
