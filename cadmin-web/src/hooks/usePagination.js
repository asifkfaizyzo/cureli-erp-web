// cadmin-web/src/hooks/usePagination.js (do not remove this comment)
// hooks/usePagination.js
import { useState, useMemo, useEffect } from 'react';
import useDynamicRowCount from './useDynamicRowCount';

const usePagination = (data = []) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = useDynamicRowCount();

  // Reset to page 1 when rowsPerPage changes (screen resize)
  useEffect(() => {
    const newTotalPages = Math.ceil(data.length / rowsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  }, [rowsPerPage, data.length, currentPage]);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  // Get current page data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  return {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    totalItems: data.length,
    totalPages,
    paginatedData,
    startIndex: (currentPage - 1) * rowsPerPage,
    endIndex: Math.min(currentPage * rowsPerPage, data.length),
  };
};

export default usePagination;