// cadmin-web/src/pages/marketplace/Orders/comps/OrdersTable.jsx (do not remove this comment)
import { useState, useEffect } from "react";
import { ShoppingBag, Eye, AlertTriangle } from "lucide-react";
import Pagination from "../../../../components/common/Pagination";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import {
  TABLE_CONFIG,
  getClickableRowClass,
} from "../../../../config/tableConfig";

const COLUMNS = {
  slNo: { key: "slNo", label: "#", width: 50, sortable: false, align: "left" },
  order: {
    key: "order",
    label: "Order ID",
    width: 140,
    sortable: false,
    align: "left",
  },
  customer: {
    key: "customer",
    label: "Customer",
    width: 180,
    sortable: false,
    align: "left",
  },
  shop: {
    key: "shop",
    label: "Shop / Branch",
    width: 200,
    sortable: false,
    align: "left",
  },
  items: {
    key: "items",
    label: "Items",
    width: 80,
    sortable: false,
    align: "center",
  },
  amount: {
    key: "amount",
    label: "Amount",
    width: 110,
    sortable: false,
    align: "left",
  },
  status: {
    key: "status",
    label: "Status",
    width: 140,
    sortable: false,
    align: "center",
  },
  date: {
    key: "date",
    label: "Placed At",
    width: 110,
    sortable: false,
    align: "left",
  },
  actions: {
    key: "actions",
    label: "",
    width: 60,
    sortable: false,
    align: "center",
  },
};

const STATUS_BADGE_CONFIG = {
  PLACED: {
    label: "Placed",
    cls: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  ACCEPTED: {
    label: "Accepted",
    cls: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  READY_FOR_PICKUP: {
    label: "Ready",
    cls: "bg-violet-100 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    cls: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
};

const fmtAmount = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const needsRider = (order) =>
  !order.has_rider && ["ACCEPTED", "READY_FOR_PICKUP"].includes(order.status);

const OrdersTable = ({
  orders = [],
  loading = false,
  currentPage,
  setCurrentPage,
  totalItems,
  rowsPerPage,
  onSelectOrder,
}) => {
  const { styles, heights } = TABLE_CONFIG;
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.values(COLUMNS).forEach((col) => {
      widths[col.key] = col.width;
    });
    return widths;
  });
  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = (e) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    setColumnWidths((prev) => ({
      ...prev,
      [resizing.column]: Math.max(50, resizing.startWidth + diff),
    }));
  };

  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const hasData = orders.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  const TableHeader = ({ column }) => {
    const config = COLUMNS[column];
    return (
      <th
        style={{ width: columnWidths[column], minWidth: 50 }}
        className={`relative group ${config.align === "center" ? "text-center" : "text-left"}`}
      >
        <div className={styles.header.cell}>{config.label}</div>
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  return (
    <div className={styles.container.wrapper}>
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table
            className="w-full border-collapse text-sm"
            style={{ minWidth: "1000px" }}
          >
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                {Object.keys(COLUMNS).map((colKey) => (
                  <TableHeader key={colKey} column={colKey} />
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton
                  rows={rowsPerPage}
                  columns={Object.keys(COLUMNS).filter(
                    (k) => k !== "slNo" && k !== "actions",
                  )}
                />
              ) : (
                orders.map((order, index) => {
                  const isNeedsRider = needsRider(order);
                  const statusCfg = STATUS_BADGE_CONFIG[order.status] || {
                    label: order.status,
                    cls: "bg-gray-100 text-gray-700 border-gray-200",
                    dot: "bg-gray-400",
                  };

                  return (
                    <tr
                      key={order.order_id}
                      onClick={() => onSelectOrder(order.order_id)}
                      className={`${getClickableRowClass(index)} ${
                        isNeedsRider
                          ? "border-l-4 border-l-amber-400 bg-amber-50/30"
                          : ""
                      }`}
                      style={{ height: `${heights.bodyRow}px` }}
                    >
                      <td
                        className={`${styles.cell.base} ${styles.cell.muted} font-medium`}
                      >
                        {startIndex + index + 1}
                      </td>

                      <td
                        className={`${styles.cell.base} font-mono text-xs text-gray-800 font-semibold`}
                      >
                        {order.order_number}
                      </td>

                      <td className={styles.cell.base}>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 truncate">
                            {order.customer_name || "—"}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {order.customer_phone || ""}
                          </span>
                        </div>
                      </td>

                      <td className={styles.cell.base}>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 truncate">
                            {order.shop?.business_name || "—"}
                          </span>
                          <span className="text-[11px] text-gray-400 truncate">
                            {order.branch?.branch_name || ""}
                          </span>
                        </div>
                      </td>

                      <td
                        className={`${styles.cell.base} ${styles.cell.center}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium text-gray-800">
                            {order.item_count ?? "—"}
                          </span>
                          {order.requires_prescription && (
                            <span className="px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold">
                              Rx
                            </span>
                          )}
                        </div>
                      </td>

                      <td
                        className={`${styles.cell.base} font-semibold text-gray-900`}
                      >
                        {order.total_amount != null
                          ? fmtAmount(order.total_amount)
                          : "—"}
                      </td>

                      <td
                        className={`${styles.cell.base} ${styles.cell.center}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.cls}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                            />
                            {statusCfg.label}
                          </span>
                          {isNeedsRider && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Needs Rider
                            </span>
                          )}
                          {order.delivery_status &&
                            !isNeedsRider &&
                            order.has_rider && (
                              <span className="text-[9px] text-gray-400 font-medium">
                                {order.delivery_status.replace(/_/g, " ")}
                              </span>
                            )}
                        </div>
                      </td>

                      <td
                        className={`${styles.cell.base} ${styles.cell.muted}`}
                      >
                        {fmtDate(order.placed_at)}
                      </td>

                      <td className={styles.cell.base}>
                        <div className={styles.actions.container}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrder(order.order_id);
                            }}
                            className={`${styles.actions.button.base} ${styles.actions.button.view}`}
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEmptyState && (
        <TableEmptyState
          icon={ShoppingBag}
          title="No marketplace orders found"
          subtitle="Try adjusting your search or status filter."
        />
      )}

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

export default OrdersTable;
