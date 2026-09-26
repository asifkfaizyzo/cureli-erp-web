// pharmacy-web/src/pages/suppliers/components/SupplierPagination.jsx (do not remove this comment)
// src/components/Supplier/SupplierPagination.jsx
import React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal 
} from "lucide-react";

const SupplierPagination = ({ currentPage, setCurrentPage, totalPages }) => {
  if (totalPages <= 1) return null;

  // --- PAGINATION LOGIC (From InvoicePagination) ---
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

  const jumpBackward = () => {
    const target = Math.max(currentPage - JUMP, 1);
    setCurrentPage(target);
  };

  const jumpForward = () => {
    const target = Math.min(currentPage + JUMP, totalPages);
    setCurrentPage(target);
  };

  // --- STYLING CLASSES (Matching InvoicePagination) ---
  const btnBase = "h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-all duration-200 select-none";
  const btnInactive = "text-gray-500 hover:bg-gray-100 hover:text-[#05015A]";
  const btnActive = "bg-[#05015A] text-white shadow-md shadow-indigo-200 font-semibold scale-105";
  const btnNav = "p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all";

  return (
    <div className="flex items-center gap-2 select-none">

      {/* First Page (ChevronsLeft) */}
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className={btnNav}
        title="First Page"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Prev */}
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className={btnNav}
        title="Previous Page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages Container */}
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
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`${btnBase} ${
              currentPage === page ? btnActive : btnInactive
            }`}
          >
            {page}
          </button>
        ))}

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

      {/* Next */}
      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className={btnNav}
        title="Next Page"
      >
        <ChevronRight size={16} />
      </button>

      {/* Last Page (ChevronsRight) */}
      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className={btnNav}
        title="Last Page"
      >
        <ChevronsRight size={16} />
      </button>

    </div>
  );
};

export default SupplierPagination;
