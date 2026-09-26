// pharmacy-web/src/hooks/purchase/useResponsiveRowCount.js (do not remove this comment)
// src/hooks/useResponsiveRowCount.js
import { useState, useEffect, useMemo } from "react";

const BREAKPOINTS = {
  '4k': { minWidth: 2560, rows: 10, rowHeight: 42 },
  'fullHd': { minWidth: 1920, rows: 10, rowHeight: 40 },
  'laptop': { minWidth: 1440, rows: 6, rowHeight: 38 },
  'smallLaptop': { minWidth: 1366, rows: 5, rowHeight: 36 },
  'default': { minWidth: 0, rows: 6, rowHeight: 36 },
};

export const useResponsiveRowCount = (customBreakpoints = null) => {
  const [config, setConfig] = useState({ 
    visibleRows: 6, 
    rowHeight: 36,
    breakpointName: 'default' 
  });
  
  const breakpoints = customBreakpoints || BREAKPOINTS;

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      
      // Find matching breakpoint (sorted by minWidth descending)
      const sortedBreakpoints = Object.entries(breakpoints)
        .sort((a, b) => b[1].minWidth - a[1].minWidth);
      
      const match = sortedBreakpoints.find(([_, bp]) => width >= bp.minWidth);
      
      if (match) {
        setConfig({
          visibleRows: match[1].rows,
          rowHeight: match[1].rowHeight || 38,
          breakpointName: match[0],
        });
      }
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [breakpoints]);

  // Calculate viewport height
  const viewportHeight = useMemo(() => {
    return config.visibleRows * config.rowHeight;
  }, [config.visibleRows, config.rowHeight]);

  return {
    visibleRows: config.visibleRows,
    rowHeight: config.rowHeight,
    viewportHeight,
    breakpointName: config.breakpointName,
  };
};

export default useResponsiveRowCount;

// // src/hooks/useResponsiveRowCount.js
// import { useState, useEffect } from "react";

// const BREAKPOINTS = {
//   '4k': { minWidth: 2560, rows: 10 },
//   'fullHd': { minWidth: 1920, rows: 10 },
//   'laptop': { minWidth: 1440, rows: 8 },
//   'smallLaptop': { minWidth: 1366, rows: 6 },
//   'default': { minWidth: 0, rows: 6 },
// };

// export const useResponsiveRowCount = (customBreakpoints = null) => {
//   const [targetRowCount, setTargetRowCount] = useState(6);
//   const breakpoints = customBreakpoints || BREAKPOINTS;

//   useEffect(() => {
//     const updateLayout = () => {
//       const width = window.innerWidth;
      
//       // Find matching breakpoint (sorted by minWidth descending)
//       const sortedBreakpoints = Object.values(breakpoints)
//         .sort((a, b) => b.minWidth - a.minWidth);
      
//       const match = sortedBreakpoints.find(bp => width >= bp.minWidth);
//       setTargetRowCount(match?.rows || 6);
//     };

//     updateLayout();
//     window.addEventListener("resize", updateLayout);
//     return () => window.removeEventListener("resize", updateLayout);
//   }, [breakpoints]);

//   return targetRowCount;
// };

// export default useResponsiveRowCount;