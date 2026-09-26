// cadmin-web/src/hooks/useRowCommuniacton1.js (do not remove this comment)

import { useState, useEffect } from 'react';

// Centralized function to calculate row count
const getRowCount = (width) => {
  if (width >= 2560) return 12;       // 4K / 27 inch
  if (width >= 1920) return 10;       // 1080p Full HD
  if (width >= 1440) return 9;       // 19 inch / high res laptop
  if (width >= 1366) return 7;        // 14 inch laptop
  return 6;                           // Default / Mobile
};

const useRowCommuniacton = () => {
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    // Use same function for initial state
    return getRowCount(window.innerWidth);
  });

  useEffect(() => {
    const updateRowCount = () => {
      setRowsPerPage(getRowCount(window.innerWidth));
    };

    // No need to call on mount since initial state is already correct
    window.addEventListener('resize', updateRowCount);
    return () => window.removeEventListener('resize', updateRowCount);
  }, []);

  return rowsPerPage;
};

export default useRowCommuniacton;