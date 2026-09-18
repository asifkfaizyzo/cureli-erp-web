// src/pages/Communications/pages/Broadcast/Email/comps/EmailScheduleModal.jsx

import { useState } from "react";
import { Calendar, X, Info } from "lucide-react";

function EmailScheduleModal({ onConfirm, onCancel }) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [error, setError] = useState("");

  const getMinDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getMinTime = () => {
    if (scheduledDate === getMinDate()) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(Math.min(now.getMinutes() + 5, 59)).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "";
  };

  const handleConfirm = () => {
    setError("");

    if (!scheduledDate || !scheduledTime) {
      setError("Please select both date and time");
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledFor <= now) {
      setError("Scheduled time must be in the future");
      return;
    }

    onConfirm(scheduledFor.toISOString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold">Schedule Email</h3>
            </div>
            <button onClick={onCancel} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">Select when you want this email to be sent:</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={getMinDate()}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={getMinTime()}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <X size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Emails are sent in batches. Large campaigns may take some time to complete.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a0280]"
          >
            <Calendar size={18} />
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailScheduleModal;