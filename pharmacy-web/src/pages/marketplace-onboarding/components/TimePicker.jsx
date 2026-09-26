// pharmacy-web/src/pages/marketplace-onboarding/components/TimePicker.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/components/TimePicker.jsx

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
} from "react";
import { createPortal } from "react-dom";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

const TimePicker = ({ value, onChange, placeholder = "Select time" }) => {
  const [isOpen, setIsOpen]   = useState(false);
  const [hours, setHours]     = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod]   = useState("AM");

  // Position of the dropdown portal
  const [dropdownStyle, setDropdownStyle] = useState({});

  const triggerRef   = useRef(null);
  const dropdownRef  = useRef(null);

  // ─── Parse incoming HH:mm (24h) → 12h state ─────────────────────
  useEffect(() => {
    if (!value) return;
    const [h, m] = value.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    setPeriod(h >= 12 ? "PM" : "AM");
    setHours(h === 0 ? 12 : h > 12 ? h - 12 : h);
    setMinutes(m);
  }, [value]);

  // ─── Calculate portal position from trigger element ──────────────
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top:      rect.bottom + 6,
      left:     rect.left + rect.width / 2,
      transform: "translateX(-50%)",
      zIndex:   9999,
    });
  }, []);

  // ─── Open / close ────────────────────────────────────────────────
  const handleOpen = () => {
    calculatePosition();
    setIsOpen(true);
  };

  // ─── Close on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        triggerRef.current  && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ─── Reposition on scroll / resize ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const update = () => calculatePosition();
    window.addEventListener("scroll",  update, true);
    window.addEventListener("resize",  update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen, calculatePosition]);

  // ─── Emit 24h time string ────────────────────────────────────────
  const emit = useCallback(
    (h, m, p) => {
      let h24 = h;
      if (p === "AM" && h === 12) h24 = 0;
      else if (p === "PM" && h !== 12) h24 = h + 12;
      onChange(
        `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
    },
    [onChange]
  );

  // ─── Spin handlers ───────────────────────────────────────────────
  const incrementHours = () => {
    const next = hours >= 12 ? 1 : hours + 1;
    setHours(next);
    emit(next, minutes, period);
  };
  const decrementHours = () => {
    const next = hours <= 1 ? 12 : hours - 1;
    setHours(next);
    emit(next, minutes, period);
  };
  const incrementMinutes = () => {
    const next = minutes >= 55 ? 0 : minutes + 5;
    setMinutes(next);
    emit(hours, next, period);
  };
  const decrementMinutes = () => {
    const next = minutes <= 0 ? 55 : minutes - 5;
    setMinutes(next);
    emit(hours, next, period);
  };
  const togglePeriod = () => {
    const next = period === "AM" ? "PM" : "AM";
    setPeriod(next);
    emit(hours, minutes, next);
  };

  const handleWheel = (e, type) => {
    e.preventDefault();
    if (type === "hours") {
      e.deltaY < 0 ? incrementHours() : decrementHours();
    } else {
      e.deltaY < 0 ? incrementMinutes() : decrementMinutes();
    }
  };

  // ─── Display ─────────────────────────────────────────────────────
  const displayValue = value
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`
    : null;

  // ─── Portal dropdown ─────────────────────────────────────────────
  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="rounded-xl border border-white/10 bg-[#0a0a1a]
            shadow-2xl shadow-black/60"
        >
          {/* Picker body */}
          <div className="flex items-center justify-center gap-2 px-4 py-4">
            {/* Hours */}
            <SpinColumn
              value={hours}
              onIncrement={incrementHours}
              onDecrement={decrementHours}
              onWheel={(e) => handleWheel(e, "hours")}
            />

            {/* Colon */}
            <span className="text-white/30 text-lg font-bold leading-none select-none">
              :
            </span>

            {/* Minutes */}
            <SpinColumn
              value={minutes}
              onIncrement={incrementMinutes}
              onDecrement={decrementMinutes}
              onWheel={(e) => handleWheel(e, "minutes")}
            />

            {/* AM / PM */}
            <div className="ml-1.5">
              <button
                type="button"
                onClick={togglePeriod}
                className="relative flex flex-col items-center w-12 rounded-lg
                  border border-white/10 overflow-hidden"
              >
                {["AM", "PM"].map((p) => (
                  <span
                    key={p}
                    className={`
                      w-full text-center py-2 text-[10px] font-bold
                      tracking-wider transition-all duration-150
                      ${period === p
                        ? "bg-white/10 text-white"
                        : "bg-transparent text-white/20 hover:text-white/30"
                      }
                    `}
                  >
                    {p}
                  </span>
                ))}
              </button>
            </div>
          </div>

          {/* Done */}
          <div className="border-t border-white/[0.06] px-3 py-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 rounded-lg text-xs font-semibold
                bg-white/[0.08] text-white/70 hover:bg-white/[0.12]
                hover:text-white transition-all duration-150"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`
          w-full flex items-center gap-2 px-2.5 py-2 rounded-lg
          border text-left transition-all duration-150
          ${isOpen
            ? "bg-white/[0.06] border-white/20 ring-2 ring-white/10"
            : "bg-white/[0.04] border-white/10 hover:border-white/15"
          }
        `}
      >
        <Clock
          size={13}
          className={`flex-shrink-0 ${displayValue ? "text-white/40" : "text-white/15"}`}
        />
        <span
          className={`text-xs font-mono flex-1 ${
            displayValue ? "text-white" : "text-white/20"
          }`}
        >
          {displayValue || placeholder}
        </span>
        <ChevronDown
          size={11}
          className={`text-white/20 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Portal-rendered dropdown — escapes any overflow/clip parent */}
      {dropdown}
    </div>
  );
};

// ─── Spin Column ──────────────────────────────────────────────────────────────
const SpinColumn = forwardRef(
  ({ value, onIncrement, onDecrement, onWheel }, ref) => (
    <div
      ref={ref}
      onWheel={onWheel}
      className="flex flex-col items-center gap-0.5 select-none"
    >
      <button
        type="button"
        onClick={onIncrement}
        className="w-11 h-7 flex items-center justify-center rounded-md
          text-white/20 hover:text-white/50 hover:bg-white/[0.06]
          transition-all duration-100 active:scale-90"
      >
        <ChevronUp size={14} />
      </button>

      <div className="w-11 h-11 flex items-center justify-center rounded-lg
        bg-white/[0.06] border border-white/10">
        <span className="text-white text-base font-mono font-semibold tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>

      <button
        type="button"
        onClick={onDecrement}
        className="w-11 h-7 flex items-center justify-center rounded-md
          text-white/20 hover:text-white/50 hover:bg-white/[0.06]
          transition-all duration-100 active:scale-90"
      >
        <ChevronDown size={14} />
      </button>
    </div>
  )
);

SpinColumn.displayName = "SpinColumn";

export default TimePicker;