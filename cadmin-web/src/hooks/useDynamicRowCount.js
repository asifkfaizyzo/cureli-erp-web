// cadmin-web/src/hooks/useDynamicRowCount.js (do not remove this comment)
// src/hooks/useDynamicRowCount.js
import { useState, useEffect, useMemo } from 'react';
import { TABLE_CONFIG } from '../config/tableConfig';

/**
 * Calculate row count based on height
 */
const calculateRowCount = (height) => {
  const { rowBreakpoints } = TABLE_CONFIG;
  
  // Sort breakpoints from highest to lowest
  const sortedBreakpoints = Object.entries(rowBreakpoints)
    .map(([h, count]) => [parseInt(h), count])
    .sort((a, b) => b[0] - a[0]);
  
  // Find the first breakpoint where screen height >= breakpoint height
  for (const [minHeight, count] of sortedBreakpoints) {
    if (height >= minHeight) {
      return count;
    }
  }
  
  // Fallback to minimum
  return 5;
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
    if (typeof window === 'undefined') return 5;
    return calculateRowCount(window.innerHeight);
  });

  useEffect(() => {
    const handleResize = () => {
      const newCount = calculateRowCount(window.innerHeight);
      setRowsPerPage(newCount);
    };

    // Recalculate on resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return rowsPerPage;
};

export default useDynamicRowCount;