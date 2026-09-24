// pharmacy-web/src/pages/purchase/billing/components/PrintPreviewModal.jsx (do not remove this comment)
// src/pages/purchase/billing/components/PrintPreviewModal.jsx
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { X, Printer } from "lucide-react";
import PurchaseInvoicePrint from "./PurchaseInvoicePrint";

const PrintPreviewModal = ({ 
  isOpen, 
  onClose, 
  rows, 
  supplier, 
  summary, 
  companyDetails,
  invoiceNumber,
  invoiceDate
}) => {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice_${invoiceNumber || supplier.invoiceNo || supplier.purchaseId}`,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Print Preview</h2>
            {invoiceNumber && (
              <p className="text-sm text-slate-500 mt-1">Invoice: {invoiceNumber}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#05015A] hover:bg-[#0a0280] text-white rounded-lg font-medium transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-slate-100 p-8">
          <div className="max-w-[210mm] mx-auto">
            <div ref={printRef}>
              <PurchaseInvoicePrint
                rows={rows}
                supplier={supplier}
                summary={summary}
                companyDetails={companyDetails}
                invoiceNumber={invoiceNumber}
                invoiceDate={invoiceDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;