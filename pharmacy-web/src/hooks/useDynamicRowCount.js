// pharmacy-web/src/hooks/useDynamicRowCount.js (do not remove this comment)
// pharmacy-web/src/hooks/useDynamicRowCount.js
import { useState, useEffect } from "react";
import { TABLE_CONFIG } from "../config/tableConfig";

/**
 * Calculate row count based on screen height
 * @param {number} height - Window inner height
 * @returns {number} Number of rows to display
 */
const calculateRowCount = (height) => {
  const { rowBreakpoints, defaultRowCount } = TABLE_CONFIG;

  // Sort breakpoints from highest to lowest
  const sortedBreakpoints = Object.entries(rowBreakpoints)
    .map(([h, count]) => [parseInt(h, 10), count])
    .sort((a, b) => b[0] - a[0]);

  // Find the first breakpoint where screen height >= breakpoint height
  for (const [minHeight, count] of sortedBreakpoints) {
    if (height >= minHeight) {
      return count;
    }
  }

  // Fallback
  return defaultRowCount || 5;
};

/**
 * Dynamic row count hook based on screen HEIGHT
 * Uses global breakpoints from tableConfig.js
 *
 * @returns {number} Number of rows to display
 */
const useDynamicRowCount = () => {
  // Initialize with actual calculated value (not a placeholder)
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    // SSR safety check
    if (typeof window === "undefined") {
      return TABLE_CONFIG.defaultRowCount || 5;
    }
    return calculateRowCount(window.innerHeight);
  });

  useEffect(() => {
    const handleResize = () => {
      const newCount = calculateRowCount(window.innerHeight);
      setRowsPerPage((prev) => {
        // Only update if changed (prevents unnecessary re-renders)
        if (newCount !== prev) {
          return newCount;
        }
        return prev;
      });
    };

    // Recalculate on resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return rowsPerPage;
};

export default useDynamicRowCount;
