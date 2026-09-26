// cadmin-web/src/pages/shops-management/comps/Pagination.jsx (do not remove this comment)
// src/components/Shops/Pagination.jsx
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  if (!setCurrentPage) {
    console.error(" Pagination missing setCurrentPage prop");
    return null;
  }

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showLeftDots = currentPage > 3;
    const showRightDots = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (showLeftDots) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (showRightDots) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  const baseBtn =
    "p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all";

  return (
    <div className="flex items-center gap-1">
      {/* First Page */}
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className={baseBtn}
        aria-label="first"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Previous Page */}
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className={baseBtn}
        aria-label="prev"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center mx-2 gap-1">
        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span
              key={`dots-${index}`}
              className="px-2 text-gray-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                currentPage === page
                  ? "bg-[#05015A] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ),
        )}
      </div>

      {/* Next Page */}
      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className={baseBtn}
        aria-label="next"
      >
        <ChevronRight size={16} />
      </button>

      {/* Last Page */}
      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className={baseBtn}
        aria-label="last"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
