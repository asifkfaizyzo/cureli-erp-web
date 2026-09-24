// cadmin-web/src/pages/Communications/pages/Enquiries/components/EnquiriesTable.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Enquiries/components/EnquiriesTable.jsx

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Inbox,
} from "lucide-react";
import { format } from "date-fns";
import {
  TABLE_CONFIG,
  getClickableRowClass,
} from "../../../../../config/tableConfig";
import TableSkeleton from "../../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../../components/common/TableEmptyState";
import Pagination from "../../../../../components/common/Pagination";

//  Define COLUMNS configuration - Reduced actions width
const COLUMNS = {
  slNo: { key: "slNo", label: "#", width: 50, sortable: false, align: "left" },
  enquiry: {
    key: "enquiry",
    label: "Enquiry",
    width: 180,
    sortable: false,
    align: "left",
  },
  contact: {
    key: "contact",
    label: "Contact Info",
    width: 220,
    sortable: false,
    align: "left",
  },
  status: {
    key: "status",
    label: "Status",
    width: 110,
    sortable: false,
    align: "center",
  },
  submitted: {
    key: "created_at",
    label: "Submitted",
    width: 120,
    sortable: false,
    align: "left",
  },
  actions: {
    key: "actions",
    label: "Actions",
    width: 80,
    sortable: false,
    align: "center",
  }, //  Reduced from 100
};

// Status configuration
const statusConfig = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Pending",
  },
  IN_PROGRESS: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "In Progress",
  },
  REPLIED: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    label: "Replied",
  },
  CLOSED: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    dot: "bg-gray-500",
    label: "Closed",
  },
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold 
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap min-w-[80px] justify-center`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`}
      />
      {config.label}
    </span>
  );
};

const EnquiriesTable = ({
  enquiries = [],
  loading = false,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  onViewEnquiry,
  onReplyEnquiry,
  onDeleteEnquiry,
  hasActiveFilters = false,
}) => {
  const { styles, heights } = TABLE_CONFIG;

  // Column widths for resizing
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.entries(COLUMNS).forEach(([key, col]) => {
      widths[key] = col.width;
    });
    return widths;
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    if (column === "slNo") return;
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    },
    [resizing],
  );

  const handleMouseUp = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM, yyyy");
    } catch {
      return "-";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "";
    }
  };

  // ============================================
  // ROW CLICK HANDLER (Opens View Modal)
  // ============================================
  const handleRowClick = (enquiry) => {
    onViewEnquiry(enquiry);
  };

  // ============================================
  // ACTION HANDLERS (Must stop propagation!)
  // ============================================
  const handleReplyClick = (e, enquiry) => {
    e.stopPropagation(); // ⚠️ CRITICAL: Prevent row click
    onReplyEnquiry(enquiry);
  };

  const handleDeleteClick = (e, enquiry) => {
    e.stopPropagation(); // ⚠️ CRITICAL: Prevent row click
    onDeleteEnquiry(enquiry);
  };

  //  Non-sortable Header Component
  const TableHeader = ({ column }) => {
    const config = COLUMNS[column];

    return (
      <th
        style={{
          width: columnWidths[column],
          height: `${heights.headerRow}px`,
        }}
        className={`relative group ${config.align === "center" ? "text-center" : ""}`}
      >
        <div className={styles.header.cell}>{config.label}</div>
        {column !== "slNo" && (
          <div
            onMouseDown={(e) => handleMouseDown(column, e)}
            className={styles.header.resizeHandle}
          />
        )}
      </th>
    );
  };

  const startIndex = (currentPage - 1) * rowsPerPage;

  //  Conditional rendering logic
  const hasData = enquiries.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  return (
    <div className={styles.container.wrapper}>
      {/*  Table - Show when loading OR has data */}
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table
            className="w-full border-collapse text-sm"
            style={{ minWidth: "800px" }}
          >
            {/* Table Header */}
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                <TableHeader column="slNo" />
                <TableHeader column="enquiry" />
                <TableHeader column="contact" />
                <TableHeader column="status" />
                <TableHeader column="submitted" />
                <TableHeader column="actions" />
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                <TableSkeleton columns={6} rows={rowsPerPage} />
              ) : (
                enquiries.map((enquiry, index) => (
                  <tr
                    key={enquiry.enquiry_id}
                    onClick={() => handleRowClick(enquiry)} // 👈 Row click opens view
                    style={{ height: `${heights.bodyRow}px` }}
                    className={getClickableRowClass(index, false)} //  Changed to clickable
                  >
                    {/* Serial Number */}
                    <td
                      className={`${styles.cell.base} ${styles.cell.muted} font-medium`}
                    >
                      {startIndex + index + 1}
                    </td>

                    {/* Enquiry Info */}
                    <td className={styles.cell.base}>
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <p
                            className={`text-sm ${styles.cell.primary} truncate max-w-[140px]`}
                            title={enquiry.name}
                          >
                            {enquiry.name}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500">
                            {enquiry.enquiry_number}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className={styles.cell.base}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Mail
                            size={12}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span
                            className={`text-xs ${styles.cell.secondary} truncate max-w-[180px]`}
                            title={enquiry.email}
                          >
                            {enquiry.email}
                          </span>
                        </div>
                        {enquiry.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone
                              size={12}
                              className="text-gray-400 flex-shrink-0"
                            />
                            <span
                              className={`text-xs ${styles.cell.secondary}`}
                            >
                              {enquiry.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <StatusBadge status={enquiry.status} />
                    </td>

                    {/* Submitted Date */}
                    <td className={styles.cell.base}>
                      <div className="flex items-start gap-1.5">
                        <Calendar
                          size={12}
                          className="text-gray-400 flex-shrink-0 mt-0.5"
                        />
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-medium ${styles.cell.primary}`}
                          >
                            {formatDate(enquiry.created_at)}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {formatTime(enquiry.created_at)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions - Reply & Delete only (NO Eye icon) */}
                    <td className={styles.cell.base}>
                      <div className={styles.actions.container}>
                        {/* Reply Button */}
                        <button
                          onClick={(e) => handleReplyClick(e, enquiry)}
                          className={`${styles.actions.button.base} text-gray-500 hover:text-green-600 hover:bg-green-50`}
                          title="Send Reply"
                        >
                          <MessageSquare size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteClick(e, enquiry)}
                          className={`${styles.actions.button.base} ${styles.actions.button.delete}`}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/*  Empty State */}
      {showEmptyState && (
        <TableEmptyState
          icon={Inbox}
          title={
            hasActiveFilters
              ? "No enquiries match your filters"
              : "No enquiries yet"
          }
          subtitle={
            hasActiveFilters
              ? "Try adjusting or clearing your filters"
              : "Enquiries will appear here when submitted"
          }
        />
      )}

      {/*  Pagination - only when has data */}
      {showPagination && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}
    </div>
  );
};

export default EnquiriesTable;

// // cadmin-web/src/pages/Communications/pages/Enquiries/components/EnquiriesTable.jsx

// import { useEffect, useState, useCallback } from "react";
// import {
//   Eye,
//   MessageSquare,
//   Trash2,
//   Mail,
//   Phone,
//   User,
//   Calendar,
// } from "lucide-react";
// import { format } from "date-fns";
// import { TABLE_CONFIG, getRowBgClass } from "../../../../../config/tableConfig"; //  Import from config
// import TableSkeleton from "../../../../../components/common/TableSkeleton"; //  Import skeleton
// import TableEmptyState from "../../../../../components/common/TableEmptyState"; //  Import empty state
// import Pagination from "../../../../../components/common/Pagination";

// //  Define COLUMNS configuration
// const COLUMNS = {
//   slNo: { key: 'slNo', label: '#', width: 50, sortable: false, align: 'left' },
//   enquiry: { key: 'enquiry', label: 'Enquiry', width: 180, sortable: false, align: 'left' },
//   contact: { key: 'contact', label: 'Contact Info', width: 220, sortable: false, align: 'left' },
//   status: { key: 'status', label: 'Status', width: 110, sortable: false, align: 'center' },
//   submitted: { key: 'created_at', label: 'Submitted', width: 120, sortable: false, align: 'left' },
//   actions: { key: 'actions', label: 'Actions', width: 100, sortable: false, align: 'center' },
// };

// // Status configuration
// const statusConfig = {
//   PENDING: {
//     bg: "bg-amber-50",
//     text: "text-amber-700",
//     border: "border-amber-200",
//     dot: "bg-amber-500",
//     label: "Pending",
//   },
//   IN_PROGRESS: {
//     bg: "bg-blue-50",
//     text: "text-blue-700",
//     border: "border-blue-200",
//     dot: "bg-blue-500",
//     label: "In Progress",
//   },
//   REPLIED: {
//     bg: "bg-green-50",
//     text: "text-green-700",
//     border: "border-green-200",
//     dot: "bg-green-500",
//     label: "Replied",
//   },
//   CLOSED: {
//     bg: "bg-gray-100",
//     text: "text-gray-600",
//     border: "border-gray-300",
//     dot: "bg-gray-500",
//     label: "Closed",
//   },
// };

// // Status Badge Component
// const StatusBadge = ({ status }) => {
//   const config = statusConfig[status] || statusConfig.PENDING;

//   return (
//     <span
//       className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
//                   ${config.bg} ${config.text} border ${config.border} whitespace-nowrap min-w-[80px] justify-center`}
//     >
//       <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
//       {config.label}
//     </span>
//   );
// };

// const EnquiriesTable = ({
//   enquiries = [],
//   loading = false,
//   currentPage,
//   setCurrentPage,
//   rowsPerPage,
//   totalItems,
//   onViewEnquiry,
//   onReplyEnquiry,
//   onDeleteEnquiry,
//   hasActiveFilters = false,
// }) => {
//   const { styles, heights } = TABLE_CONFIG;

//   // Column widths for resizing
//   const [columnWidths, setColumnWidths] = useState({
//     slNo: COLUMNS.slNo.width,
//     enquiry: COLUMNS.enquiry.width,
//     contact: COLUMNS.contact.width,
//     status: COLUMNS.status.width,
//     submitted: COLUMNS.submitted.width,
//     actions: COLUMNS.actions.width,
//   });

//   const [resizing, setResizing] = useState(null);

//   const handleMouseDown = (column, e) => {
//     if (column === "slNo") return;
//     e.preventDefault();
//     e.stopPropagation();
//     setResizing({
//       column,
//       startX: e.clientX,
//       startWidth: columnWidths[column],
//     });
//   };

//   const handleMouseMove = useCallback(
//     (e) => {
//       if (!resizing) return;
//       const diff = e.clientX - resizing.startX;
//       const newWidth = Math.max(50, resizing.startWidth + diff);
//       setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
//     },
//     [resizing]
//   );

//   const handleMouseUp = useCallback(() => setResizing(null), []);

//   useEffect(() => {
//     if (!resizing) return;
//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("mouseup", handleMouseUp);
//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("mouseup", handleMouseUp);
//     };
//   }, [resizing, handleMouseMove, handleMouseUp]);

//   const formatDate = (dateString) => {
//     if (!dateString) return "-";
//     try {
//       return format(new Date(dateString), "dd MMM, yyyy");
//     } catch {
//       return "-";
//     }
//   };

//   const formatTime = (dateString) => {
//     if (!dateString) return "";
//     try {
//       return format(new Date(dateString), "HH:mm");
//     } catch {
//       return "";
//     }
//   };

//   //  Non-sortable Header Component
//   const TableHeader = ({ column }) => {
//     const config = COLUMNS[column];

//     return (
//       <th
//         style={{ width: columnWidths[column], height: `${heights.headerRow}px` }}
//         className={`relative group ${config.align === 'center' ? 'text-center' : ''}`}
//       >
//         <div className={styles.header.cell}>{config.label}</div>
//         <div
//           onMouseDown={(e) => handleMouseDown(column, e)}
//           className={styles.header.resizeHandle}
//         />
//       </th>
//     );
//   };

//   const startIndex = (currentPage - 1) * rowsPerPage;

//   //  Conditional rendering logic
//   const hasData = enquiries.length > 0;
//   const showTable = loading || hasData;
//   const showEmptyState = !loading && !hasData;
//   const showPagination = !loading && hasData;

//   return (
//     <div className={styles.container.wrapper}>
//       {/*  Table - Show when loading OR has data */}
//       {showTable && (
//         <div className="flex-1 min-h-0 overflow-auto">
//           <table className="w-full border-collapse text-sm" style={{ minWidth: "900px" }}>
//             {/* Table Header */}
//             <thead className="sticky top-0 z-10">
//               <tr className={styles.header.row}>
//                 <TableHeader column="slNo" />
//                 <TableHeader column="enquiry" />
//                 <TableHeader column="contact" />
//                 <TableHeader column="status" />
//                 <TableHeader column="submitted" />
//                 <TableHeader column="actions" />
//               </tr>
//             </thead>

//             {/* Table Body */}
//             <tbody>
//               {loading ? (
//                 <TableSkeleton columns={6} rows={rowsPerPage} />
//               ) : (
//                 enquiries.map((enquiry, index) => (
//                   <tr
//                     key={enquiry.enquiry_id}
//                     style={{ height: `${heights.bodyRow}px` }}
//                     className={getRowBgClass(index, false)}
//                   >
//                     {/* Serial Number */}
//                     <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
//                       {startIndex + index + 1}
//                     </td>

//                     {/* Enquiry Info */}
//                     <td className={styles.cell.base}>
//                       <div className="flex items-center gap-2">
//                         <div className="min-w-0">
//                           <p className={`text-sm ${styles.cell.primary} truncate max-w-[140px]`} title={enquiry.name}>
//                             {enquiry.name}
//                           </p>
//                           <p className="text-[10px] font-mono text-gray-500">
//                             {enquiry.enquiry_number}
//                           </p>
//                         </div>
//                       </div>
//                     </td>

//                     {/* Contact Info */}
//                     <td className={styles.cell.base}>
//                       <div className="flex flex-col gap-1">
//                         <div className="flex items-center gap-1.5">
//                           <Mail size={12} className="text-gray-400 flex-shrink-0" />
//                           <span
//                             className={`text-xs ${styles.cell.secondary} truncate max-w-[180px]`}
//                             title={enquiry.email}
//                           >
//                             {enquiry.email}
//                           </span>
//                         </div>
//                         {enquiry.phone && (
//                           <div className="flex items-center gap-1.5">
//                             <Phone size={12} className="text-gray-400 flex-shrink-0" />
//                             <span className={`text-xs ${styles.cell.secondary}`}>
//                               {enquiry.phone}
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </td>

//                     {/* Status */}
//                     <td className={`${styles.cell.base} ${styles.cell.center}`}>
//                       <StatusBadge status={enquiry.status} />
//                     </td>

//                     {/* Submitted Date */}
//                     <td className={styles.cell.base}>
//                       <div className="flex items-start gap-1.5">
//                         <Calendar size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
//                         <div className="flex flex-col">
//                           <span className={`text-xs font-medium ${styles.cell.primary}`}>
//                             {formatDate(enquiry.created_at)}
//                           </span>
//                           <span className="text-[10px] text-gray-500">
//                             {formatTime(enquiry.created_at)}
//                           </span>
//                         </div>
//                       </div>
//                     </td>

//                     {/* Actions */}
//                     <td className={styles.cell.base}>
//                       <div className={styles.actions.container}>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             onViewEnquiry(enquiry);
//                           }}
//                           className={`${styles.actions.button.base} ${styles.actions.button.view}`}
//                           title="View Details"
//                         >
//                           <Eye size={16} />
//                         </button>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             onReplyEnquiry(enquiry);
//                           }}
//                           className={`${styles.actions.button.base} text-gray-500 hover:text-green-600 hover:bg-green-50`}
//                           title="Send Reply"
//                         >
//                           <MessageSquare size={16} />
//                         </button>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             onDeleteEnquiry(enquiry);
//                           }}
//                           className={`${styles.actions.button.base} ${styles.actions.button.delete}`}
//                           title="Delete"
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/*  Empty State */}
//       {showEmptyState && (
//         <TableEmptyState
//           message={hasActiveFilters ? "No enquiries match your filters" : "No enquiries yet"}
//           description={
//             hasActiveFilters
//               ? "Try adjusting or clearing your filters"
//               : "Enquiries will appear here when submitted"
//           }
//         />
//       )}

//       {/*  Pagination - only when has data */}
//       {showPagination && (
//         <Pagination
//           currentPage={currentPage}
//           setCurrentPage={setCurrentPage}
//           totalItems={totalItems}
//           rowsPerPage={rowsPerPage}
//         />
//       )}
//     </div>
//   );
// };

// export default EnquiriesTable;
