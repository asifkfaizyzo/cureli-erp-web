// cadmin-web/src/components/common/TableSkeleton.jsx (do not remove this comment)
// src/components/common/TableSkeleton.jsx
import React from 'react';
import { TABLE_CONFIG } from '../../config/tableConfig';

/**
 * Skeleton loading rows for tables
 * 
 * @param {number} rows - Number of skeleton rows to show
 * @param {Array} columns - Array of column configs with width info
 *                          Example: [{ key: 'name', width: 150 }, { key: 'email', width: 200 }]
 */
const TableSkeleton = ({ rows = 5, columns = [] }) => {
  const { styles, heights } = TABLE_CONFIG;

  // If no columns provided, create default 6 columns
  const skeletonColumns = columns.length > 0 
    ? columns 
    : Array(6).fill(null).map((_, i) => ({ key: `col-${i}`, width: 'auto' }));

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={`skeleton-row-${rowIndex}`}
          className={`${styles.skeleton.row} ${rowIndex % 2 === 0 ? styles.row.even : styles.row.odd}`}
          style={{ height: `${heights.bodyRow}px` }}
        >
          {/* Serial Number Column */}
          <td className={styles.cell.base}>
            <div className="h-4 w-6 bg-gray-200 rounded" />
          </td>

          {/* Dynamic Columns */}
          {skeletonColumns.map((col, colIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${colIndex}`} className={styles.cell.base}>
              <div 
                className={styles.skeleton.cell}
                style={{ 
                  width: getSkeletonWidth(colIndex),
                }}
              />
            </td>
          ))}

          {/* Actions Column */}
          <td className={`${styles.cell.base} ${styles.cell.center}`}>
            <div className="flex items-center justify-center gap-2">
              <div className="h-6 w-6 bg-gray-200 rounded" />
              <div className="h-6 w-6 bg-gray-200 rounded" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * Get varying skeleton widths for visual interest
 */
const getSkeletonWidth = (index) => {
  const widths = ['70%', '85%', '60%', '90%', '50%', '75%'];
  return widths[index % widths.length];
};

export default TableSkeleton;