// pharmacy-web/src/components/common/Tooltip.jsx (do not remove this comment)
// pharmacy-web/src/components/common/Tooltip.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Lightweight accessible tooltip component
 * - Activates on hover and focus
 * - Supports top, bottom, left, right positions
 * - Uses Tailwind CSS only
 * - Accessible: works with keyboard navigation
 */
const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 200,
  className = "",
  contentClassName = "",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Adjust position if tooltip would overflow viewport
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;

      let newPosition = position;

      if (position === "top" && tooltipRect.top < padding) {
        newPosition = "bottom";
      } else if (
        position === "bottom" &&
        tooltipRect.bottom > window.innerHeight - padding
      ) {
        newPosition = "top";
      } else if (position === "left" && tooltipRect.left < padding) {
        newPosition = "right";
      } else if (
        position === "right" &&
        tooltipRect.right > window.innerWidth - padding
      ) {
        newPosition = "left";
      }

      if (newPosition !== actualPosition) {
        setActualPosition(newPosition);
      }
    }
  }, [isVisible, position, actualPosition]);

  const showTooltip = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setActualPosition(position);
  };

  if (!content || disabled) {
    return <>{children}</>;
  }

  // Position classes
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  // Arrow classes
  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900",
    right:
      "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900",
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        role="tooltip"
        aria-hidden={!isVisible}
        className={`
          absolute z-[100] px-2.5 py-1.5 
          text-xs font-medium text-white 
          bg-gray-900 rounded-lg shadow-lg
          whitespace-nowrap pointer-events-none
          transition-all duration-150
          ${positionClasses[actualPosition]}
          ${isVisible ? "opacity-100 visible" : "opacity-0 invisible"}
          ${contentClassName}
        `}
      >
        {content}

        {/* Arrow */}
        <span
          className={`
            absolute w-0 h-0 
            border-4 border-solid
            ${arrowClasses[actualPosition]}
          `}
        />
      </div>
    </div>
  );
};

/**
 * Portal-based tooltip — renders outside the DOM tree.
 * Use this inside overflow:hidden containers (tables, modals, etc.)
 * where the regular Tooltip would get clipped.
 *
 * Same API as Tooltip, but renders via createPortal to document.body.
 */
export const PortalTooltip = ({
  children,
  content,
  position = "top",
  delay = 200,
  className = "",
  contentClassName = "",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState(null);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef(null);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const MARGIN = 8;
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    // Estimate tooltip size (will refine after render)
    const estWidth = 220;
    const estHeight = 40;

    let pos = position;

    // Flip if not enough space
    if (pos === "top" && rect.top < estHeight + MARGIN) {
      pos = "bottom";
    } else if (
      pos === "bottom" &&
      viewportH - rect.bottom < estHeight + MARGIN
    ) {
      pos = "top";
    } else if (pos === "left" && rect.left < estWidth + MARGIN) {
      pos = "right";
    } else if (pos === "right" && viewportW - rect.right < estWidth + MARGIN) {
      pos = "left";
    }

    let top, left;

    switch (pos) {
      case "top":
        top = rect.top - MARGIN;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + MARGIN;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - MARGIN;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + MARGIN;
        break;
      default:
        top = rect.top - MARGIN;
        left = rect.left + rect.width / 2;
    }

    setActualPosition(pos);
    setCoords({ top, left });
  }, [position]);

  // Refine position after tooltip renders (now we know actual size)
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !coords) return;

    const tt = tooltipRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const EDGE_PAD = 8;

    // Clamp horizontally so it doesn't overflow left/right edges
    if (
      (actualPosition === "top" || actualPosition === "bottom") &&
      tt.width > 0
    ) {
      let clampedLeft = coords.left;

      // Would overflow left?
      if (clampedLeft - tt.width / 2 < EDGE_PAD) {
        clampedLeft = EDGE_PAD + tt.width / 2;
      }
      // Would overflow right?
      if (clampedLeft + tt.width / 2 > viewportW - EDGE_PAD) {
        clampedLeft = viewportW - EDGE_PAD - tt.width / 2;
      }

      if (clampedLeft !== coords.left) {
        setCoords((prev) => ({ ...prev, left: clampedLeft }));
      }
    }
  }, [isVisible, coords, actualPosition]);

  const showTooltip = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
    setCoords(null);
  };

  if (!content || disabled) {
    return <>{children}</>;
  }

  // Transform for positioning
  const getTransform = () => {
    switch (actualPosition) {
      case "top":
        return "translate(-50%, -100%)";
      case "bottom":
        return "translate(-50%, 0)";
      case "left":
        return "translate(-100%, -50%)";
      case "right":
        return "translate(0, -50%)";
      default:
        return "translate(-50%, -100%)";
    }
  };

  // Arrow styles
  const arrowPositionStyles = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900",
    right:
      "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900",
  };

  const tooltip =
    isVisible && coords
      ? createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={`
              fixed z-[9999] px-2.5 py-1.5
              text-xs font-medium text-white
              bg-gray-900 rounded-lg shadow-lg
              pointer-events-none
              transition-opacity duration-150
              opacity-100
              ${contentClassName}
            `}
            style={{
              top: coords.top,
              left: coords.left,
              transform: getTransform(),
              maxWidth: "260px",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {content}
            <span
              className={`absolute w-0 h-0 border-4 border-solid ${arrowPositionStyles[actualPosition]}`}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={triggerRef}
      className={`inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {tooltip}
    </div>
  );
};

/**
 * Preset tooltip for status badges
 * Includes predefined messages for Cancelled and Closed statuses
 */
export const StatusTooltip = ({ status, children }) => {
  const statusMessages = {
    CANCELLED: "You cancelled this ticket before it was resolved.",
    CLOSED: "This ticket was resolved and closed by support.",
  };

  const message = statusMessages[status];

  if (!message) {
    return <>{children}</>;
  }

  return (
    <Tooltip content={message} position="top">
      {children}
    </Tooltip>
  );
};

export default Tooltip;
