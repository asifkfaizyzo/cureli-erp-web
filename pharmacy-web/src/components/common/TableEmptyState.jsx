// pharmacy-web/src/components/common/TableEmptyState.jsx (do not remove this comment)
// src/components/common/TableEmptyState.jsx
import React from 'react';
import { Users } from 'lucide-react';
import { TABLE_CONFIG } from '../../config/tableConfig';

/**
 * Empty state component for tables
 * Displays when no data is available
 * 
 * @param {Component} icon - Lucide icon component
 * @param {string} title - Main message
 * @param {string} subtitle - Secondary message
 * @param {ReactNode} action - Optional action button/link
 */
const TableEmptyState = ({
  icon: Icon = Users,
  title = 'No data found',
  subtitle = 'Try adjusting your search or filters',
  action = null,
  iconSize = 32,
}) => {
  const { emptyState } = TABLE_CONFIG.styles;

  return (
    <div className={emptyState.container}>
      <div className={emptyState.iconWrapper}>
        <Icon size={iconSize} className={emptyState.icon} />
      </div>
      <p className={emptyState.title}>{title}</p>
      <p className={emptyState.subtitle}>{subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default TableEmptyState;