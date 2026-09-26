// pharmacy-web/src/pages/inventory/components/InventoryPagination.jsx (do not remove this comment)
// components/InventoryPagination.jsx
import React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,    // Added
  ChevronsRight,   // Added
  MoreHorizontal 
} from "lucide-react";

const InventoryPagination = ({ 
  currentPage, 
  setCurrentPage, 
  totalItems,
  rowsPerPage,
}) => {
  
  // --- CALCULATE TOTAL PAGES ---
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // --- PAGINATION LOGIC ---
  const WINDOW = 3;
  const JUMP = 3;

  const computeWindowStart = (page) => {
    if (totalPages <= WINDOW) return 1;
    let start = page - 1;
    if (start < 1) start = 1;
    if (start > totalPages - WINDOW + 1) start = totalPages - WINDOW + 1;
    return start;
  };

  const windowStart = computeWindowStart(currentPage);
  const windowEnd = Math.min(totalPages, windowStart + WINDOW - 1);

  const pages = [];
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

  const goPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const jumpBackward = () => {
    const target = Math.max(currentPage - JUMP, 1);
    setCurrentPage(target);
  };

  const jumpForward = () => {
    const target = Math.min(currentPage + JUMP, totalPages);
    setCurrentPage(target);
  };

  // --- STYLING CLASSES ---
  const btnBase = "h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-all duration-200 select-none";
  const btnInactive = "text-gray-500 hover:bg-gray-100 hover:text-[#05015A]";
  const btnActive = "bg-[#05015A] text-white shadow-md shadow-indigo-200 font-semibold scale-105";
  const btnNav = "p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all";

  if (totalPages === 0) return null;

  // Calculate display range
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  return (
    <div className="flex w-full items-center justify-between px-4 py-3 bg-white select-none">
      
      {/* Left: Page Info with Item Range */}
      <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-gray-500">
        <span>
          Showing <span className="text-[#05015A] font-bold">{startItem}-{endItem}</span> of <span className="text-gray-900">{totalItems}</span>
        </span>
        <span className="text-gray-300">|</span>
        <span>
          Page <span className="text-[#05015A] font-bold">{currentPage}</span> of <span className="text-gray-900">{totalPages}</span>
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        
        {/* << FIRST PAGE (Added) */}
        <button 
          onClick={() => setCurrentPage(1)} 
          disabled={currentPage === 1} 
          className={btnNav}
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* < PREVIOUS */}
        <button onClick={goPrev} disabled={currentPage === 1} className={btnNav}>
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 px-2">
          {/* LEFT JUMP (...) */}
          {windowStart > 1 && (
            <button
              onClick={jumpBackward}
              className={`${btnBase} text-gray-400 hover:text-[#05015A] hover:bg-blue-50`}
              title={`Jump back ${JUMP} pages`}
            >
              <MoreHorizontal size={16} />
            </button>
          )}

          {/* PAGE NUMBERS */}
          {pages.map((page) => {
            const active = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`${btnBase} ${active ? btnActive : btnInactive}`}
              >
                {page}
              </button>
            );
          })}

          {/* RIGHT JUMP (...) */}
          {windowEnd < totalPages && (
            <button
              onClick={jumpForward}
              className={`${btnBase} text-gray-400 hover:text-[#05015A] hover:bg-blue-50`}
              title={`Jump forward ${JUMP} pages`}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>

        {/* > NEXT */}
        <button onClick={goNext} disabled={currentPage === totalPages} className={btnNav}>
          <ChevronRight size={16} />
        </button>

        {/* >> LAST PAGE (Added) */}
        <button 
          onClick={() => setCurrentPage(totalPages)} 
          disabled={currentPage === totalPages} 
          className={btnNav}
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>

      </div>
    </div>
  );
};

export default InventoryPagination;
