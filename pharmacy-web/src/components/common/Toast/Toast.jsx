// pharmacy-web/src/components/common/Toast/Toast.jsx (do not remove this comment)
// src/components/common/Toast/Toast.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const Toast = ({
  id,
  type = "info",
  title,
  message,
  duration = 4000,
  onClose,
  showProgress = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef(progress);
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(duration);

  const toastConfig = {
    success: {
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      ringColor: "#059669",
      bgBase: "bg-white/70",
      bgGradient: "from-emerald-100/80 via-emerald-50/50 to-white/70",
      borderColor: "border-emerald-200/60",
      shadowColor: "shadow-emerald-200/50",
      titleColor: "text-emerald-800",
      messageColor: "text-emerald-700",
      iconBg: "bg-emerald-100",
      ringBg: "stroke-emerald-100",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-600",
      ringColor: "#dc2626",
      bgBase: "bg-white/70",
      bgGradient: "from-red-100/80 via-red-50/50 to-white/70",
      borderColor: "border-red-200/60",
      shadowColor: "shadow-red-200/50",
      titleColor: "text-red-800",
      messageColor: "text-red-700",
      iconBg: "bg-red-100",
      ringBg: "stroke-red-100",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      ringColor: "#d97706",
      bgBase: "bg-white/70",
      bgGradient: "from-amber-100/80 via-amber-50/50 to-white/70",
      borderColor: "border-amber-200/60",
      shadowColor: "shadow-amber-200/50",
      titleColor: "text-amber-800",
      messageColor: "text-amber-700",
      iconBg: "bg-amber-100",
      ringBg: "stroke-amber-100",
    },
    info: {
      icon: Info,
      iconColor: "text-indigo-600",
      ringColor: "#4f46e5",
      bgBase: "bg-white/70",
      bgGradient: "from-indigo-100/80 via-indigo-50/50 to-white/70",
      borderColor: "border-indigo-200/60",
      shadowColor: "shadow-indigo-200/50",
      titleColor: "text-indigo-800",
      messageColor: "text-indigo-700",
      iconBg: "bg-indigo-100",
      ringBg: "stroke-indigo-100",
    },
  };

  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  // Ring size
  const size = 36;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  //  Define handleClose with useCallback BEFORE the effects that use it
  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onClose?.(id), 300);
  }, [id, onClose]);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Progress timer
  useEffect(() => {
    if (duration <= 0) return;

    let intervalId;

    const tick = () => {
      if (!isPaused) {
        if (!startTimeRef.current) startTimeRef.current = Date.now();
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, remainingTimeRef.current - elapsed);
        const newProgress = (remaining / duration) * 100;
        setProgress(newProgress);
        progressRef.current = newProgress;
        if (remaining <= 0) handleClose();
      }
    };

    intervalId = setInterval(tick, 16);
    return () => clearInterval(intervalId);
  }, [duration, isPaused, handleClose]);

  // Pause/resume tracking
  useEffect(() => {
    if (isPaused) {
      remainingTimeRef.current = (progressRef.current / 100) * duration;
      startTimeRef.current = null;
    } else {
      startTimeRef.current = Date.now();
    }
  }, [isPaused, duration]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`
        relative w-[380px] max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden font-poppins
        ${config.bgBase}
        bg-gradient-to-r ${config.bgGradient}
        backdrop-blur-xl
        border ${config.borderColor}
        shadow-lg ${config.shadowColor}
        transform transition-all duration-300 ease-out cursor-default
        hover:shadow-xl hover:scale-[1.01]
        ${
          isVisible && !isLeaving
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-4 opacity-0 scale-95"
        }
      `}
    >
      <div className="flex gap-3 px-3 py-3">
        {/* Circular Progress Ring */}
        <div className="relative flex-shrink-0 self-start mt-0.5">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-[30px] h-[30px] rounded-full ${config.iconBg}`}
            />
          </div>

          <svg width={size} height={size} className="-rotate-90 relative z-10">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={config.ringBg}
              strokeWidth={strokeWidth}
            />
            {showProgress && duration > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={config.ringColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-none"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Icon size={16} className={config.iconColor} strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-0.5">
          {title && (
            <p
              className={`text-sm font-semibold ${config.titleColor} leading-tight break-words`}
            >
              {title}
            </p>
          )}
          {message && (
            <p
              className={`text-xs ${config.messageColor} ${title ? "mt-1" : ""} leading-relaxed break-words`}
            >
              {message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center self-start
            text-gray-400 hover:text-gray-600 hover:bg-black/5
            transition-all duration-200 flex-shrink-0 active:scale-90"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Paused Indicator */}
      {isPaused && (
        <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
          <div
            className="w-1 h-1 rounded-full animate-pulse"
            style={{ backgroundColor: config.ringColor }}
          />
          <span
            className={`text-[9px] ${config.messageColor} font-medium opacity-60`}
          >
            Paused
          </span>
        </div>
      )}
    </div>
  );
};

export default Toast;
