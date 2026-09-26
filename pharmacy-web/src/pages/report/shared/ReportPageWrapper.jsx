// pharmacy-web/src/pages/report/shared/ReportPageWrapper.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/shared/ReportPageWrapper.jsx

import { FileText } from "lucide-react";
import ExportButtons from "./ExportButtons";

const ReportPageWrapper = ({
  title,
  subtitle,
  icon: Icon = FileText,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-100",
  filters,
  exportData,
  exportFilename,
  exportColumns,
  children,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-3 gap-3">
      {/* Header */}
      <div className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon size={18} className={iconColor} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {exportData && exportData.length > 0 && (
          <ExportButtons
            data={exportData}
            filename={exportFilename || "report"}
            columns={exportColumns || []}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500">Loading report...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ReportPageWrapper;