// pharmacy-web/src/pages/report/shared/ReportPagination.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/shared/ReportPagination.jsx

import { ChevronLeft, ChevronRight } from "lucide-react";

const ReportPagination = ({
  total = 0,
  limit = 50,
  offset = 0,
  onPageChange,
}) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) pages.push(i);

  const goTo = (page) => {
    if (page < 1 || page > totalPages) return;
    onPageChange((page - 1) * limit);
  };

  return (
    <div className="shrink-0 px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-white">
      <p className="text-xs text-gray-500">
        Showing {Math.min(offset + 1, total)}–{Math.min(offset + limit, total)}{" "}
        of {total} results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goTo(p)}
            className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
              p === currentPage
                ? "bg-indigo-500 text-white border-indigo-500"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ReportPagination;