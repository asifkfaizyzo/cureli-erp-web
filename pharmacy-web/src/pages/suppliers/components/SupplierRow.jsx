// pharmacy-web/src/pages/suppliers/components/SupplierRow.jsx (do not remove this comment)
// src/pages/suppliers/components/SupplierRow.jsx
import { memo, forwardRef, useImperativeHandle, useRef } from "react";
import { Eye, Pencil, Trash2, Layers, Building2 } from "lucide-react";

const SupplierRow = memo(
  forwardRef(
    (
      {
        item,
        rowNumber = 1,
        isEven = false,
        onRowClick,
        loading,
        rowHeight = 36,
        isGlobalMode = false,
        isSuperAdmin = false,
      },
      ref,
    ) => {
      const rowRef = useRef(null);

      useImperativeHandle(
        ref,
        () => ({
          scrollIntoView: () => {
            rowRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          },
        }),
        [],
      );

      const cellBase =
        "border-b border-r border-slate-200 last:border-r-0 p-0 overflow-hidden";

      const shimmer = (width = "w-24") => (
        <div className={`h-3 ${width} bg-gray-200 rounded animate-pulse`} />
      );

      //  Handle linked branches display
      const linkedBranches = item.linked_branches || [];
      const branchCount = linkedBranches.length;

      return (
        <tr
          ref={rowRef}
          style={{ height: `${rowHeight}px` }}
          onClick={() => onRowClick("view", item)}
          className={`
        group transition-all duration-100 cursor-pointer
        ${isEven ? "bg-white" : "bg-slate-50/50"}
        hover:bg-indigo-50/40 
        border-l-2 border-l-transparent
        hover:border-l-indigo-400
      `}
        >
          {/* ROW NUMBER */}
          <td className={`${cellBase} text-center bg-slate-50`}>
            <div className="flex items-center justify-center h-full">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold bg-indigo-500 text-white">
                {rowNumber}
              </span>
            </div>
          </td>

          {/* SUPPLIER ID */}
          <td className={`${cellBase} bg-blue-50/30`}>
            <div className="px-1.5 py-1 h-full flex items-center">
              {loading ? (
                shimmer("w-20")
              ) : (
                <span className="font-mono text-[9px] 2xl:text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.supplier_id?.slice(-8) || item.supplierId}
                </span>
              )}
            </div>
          </td>

          {/* NAME */}
          <td className={`${cellBase}`}>
            <div className="px-1.5 py-1 h-full flex items-center">
              {loading ? (
                shimmer("w-28")
              ) : (
                <span className="font-semibold text-[9px] 2xl:text-[10px] text-slate-800 truncate">
                  {item.name}
                </span>
              )}
            </div>
          </td>

          {/*  BRANCHES COLUMN (Global Mode Only) */}
          {isGlobalMode && (
            <td className={`${cellBase} bg-purple-50/20`}>
              <div className="px-1 py-1 h-full flex items-center">
                {loading ? (
                  shimmer("w-16")
                ) : (
                  <div className="flex flex-wrap gap-0.5 items-center">
                    {linkedBranches.slice(0, 2).map((branch) => (
                      <span
                        key={branch.branch_id}
                        className={`
                      inline-flex items-center px-1 py-0.5 rounded text-[8px] font-medium
                      ${
                        branch.branch_type === "main"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    `}
                        title={branch.branch_name}
                      >
                        {branch.branch_type === "main" && (
                          <Building2 size={8} className="mr-0.5" />
                        )}
                        {branch.branch_name}
                      </span>
                    ))}
                    {branchCount > 2 && (
                      <span className="text-[8px] text-gray-500 font-medium px-1">
                        +{branchCount - 2}
                      </span>
                    )}
                    {branchCount === 0 && (
                      <span className="text-[8px] text-gray-400 italic">
                        No branches
                      </span>
                    )}
                  </div>
                )}
              </div>
            </td>
          )}

          {/* CONTACT */}
          <td className={`${cellBase} bg-cyan-50/30`}>
            <div className="px-1 py-1 h-full flex items-center justify-center">
              {loading ? (
                shimmer("w-20")
              ) : (
                <span className="text-[8px] 2xl:text-[9px] text-slate-700 font-mono">
                  {item.office_phone ||
                    item.personal_phone ||
                    item.contact ||
                    "—"}
                </span>
              )}
            </div>
          </td>

          {/* EMAIL */}
          <td className={`${cellBase}`}>
            <div className="px-1.5 py-1 h-full flex items-center">
              {loading ? (
                shimmer("w-36")
              ) : item.email ? (
                <a
                  href={`mailto:${item.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[9px] 2xl:text-[10px] text-blue-600 hover:text-blue-700 hover:underline truncate transition-colors"
                >
                  {item.email}
                </a>
              ) : (
                <span className="text-[9px] text-gray-400">—</span>
              )}
            </div>
          </td>

          {/* GST */}
          <td className={`${cellBase} bg-purple-50/20`}>
            <div className="px-1 py-1 h-full flex items-center justify-center">
              {loading ? (
                shimmer("w-24")
              ) : (
                <span className="text-[8px] 2xl:text-[9px] text-slate-700 font-mono">
                  {item.gst_number || item.gst || "—"}
                </span>
              )}
            </div>
          </td>

          {/* ACTIONS */}
          <td className={`${cellBase} bg-slate-50`}>
            <div className="px-1 py-1 h-full flex items-center justify-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick("view", item);
                }}
                className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                title="View"
              >
                <Eye size={12} className="text-blue-600" />
              </button>

              {/*  Show Manage Branches for Super Admin in Global Mode */}
              {isSuperAdmin && isGlobalMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick("manage-branches", item);
                  }}
                  className="p-0.5 hover:bg-purple-100 rounded transition-colors"
                  title="Manage Branches"
                >
                  <Layers size={12} className="text-purple-600" />
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick("edit", item);
                    }}
                    className="p-0.5 hover:bg-amber-100 rounded transition-colors"
                    title="Edit"
                    disabled={isGlobalMode}
                  >
                    <Pencil
                      size={12}
                      className={
                        isGlobalMode ? "text-gray-300" : "text-amber-600"
                      }
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick("delete", item);
                    }}
                    className="p-0.5 hover:bg-red-100 rounded transition-colors"
                    title={
                      isGlobalMode
                        ? "Cannot delete in all branches view"
                        : "Delete"
                    }
                    disabled={isGlobalMode}
                  >
                    <Trash2
                      size={12}
                      className={
                        isGlobalMode ? "text-gray-300" : "text-red-600"
                      }
                    />
                  </button>
                </>
              )}
            </div>
          </td>
        </tr>
      );
    },
  ),
);

SupplierRow.displayName = "SupplierRow";
export default SupplierRow;
