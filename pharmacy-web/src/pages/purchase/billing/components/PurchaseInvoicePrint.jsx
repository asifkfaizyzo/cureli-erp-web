// pharmacy-web/src/pages/purchase/billing/components/PurchaseInvoicePrint.jsx (do not remove this comment)
// src/pages/purchase/billing/components/PurchaseInvoicePrint.jsx
// No structural changes needed — the component already accepts companyDetails
// as a prop.  The only update is tightening the default fallback so it is
// obvious when real data has not yet been injected.

const PurchaseInvoicePrint = ({
  rows,
  supplier,
  summary,
  companyDetails = {
    name: "YOUR PHARMACY NAME",
    address: "",
    phone: "",
    email: "",
    gstin: "",
    drugLicense: "",
  },
  invoiceNumber,
  invoiceDate,
  billedBy = "Staff",
}) => {
  // Filter out FREE items and rows with no name
  const dataRows = rows.filter(
    (row) => row.name && row.name.trim() !== "" && !row.isFreeItem,
  );

  // Safe number formatting with fallback to 0
  const safeNumber = (value) => {
    const num = Number(value) || 0;
    return isFinite(num) ? num : 0;
  };

  // Safe summary values with proper defaults
  const safeSummary = {
    subTotal: safeNumber(summary?.subTotal),
    cgst: safeNumber(summary?.cgst),
    sgst: safeNumber(summary?.sgst),
    total: safeNumber(summary?.total),
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString("en-IN");
    try {
      return new Date(dateStr).toLocaleDateString("en-IN");
    } catch {
      return new Date().toLocaleDateString("en-IN");
    }
  };

  // Format time
  const formatTime = () => {
    return new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Number to words converter
  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const convertLessThanThousand = (n) => {
      if (n === 0) return "";
      if (n < 20) return ones[n];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
      );
    };

    const safeNum = safeNumber(num);
    if (safeNum === 0) return "Zero Rupees Only";

    const intPart = Math.floor(safeNum);
    const crore = Math.floor(intPart / 10000000);
    const lakh = Math.floor((intPart % 10000000) / 100000);
    const thousand = Math.floor((intPart % 100000) / 1000);
    const hundred = Math.floor(intPart % 1000);
    const paise = Math.round((safeNum % 1) * 100);

    let result = "";
    if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
    if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
    if (thousand > 0)
      result += convertLessThanThousand(thousand) + " Thousand ";
    if (hundred > 0) result += convertLessThanThousand(hundred);

    result = result.trim() + " Rupees";
    if (paise > 0)
      result += " and " + convertLessThanThousand(paise) + " Paise";
    result += " Only";

    return result;
  };

  const displayInvoiceNumber =
    invoiceNumber || supplier?.purchaseId || "DRAFT";
  const displayInvoiceDate = formatDate(
    invoiceDate || supplier?.invoiceDate || supplier?.receivedOn,
  );

  return (
    <div className="print-container">
      <div className="a4-page">
        {/* ── Header ── */}
        <header className="invoice-header">
          <div className="company-info">
            <h1 className="company-name">{companyDetails.name}</h1>

            {companyDetails.address && (
              <p className="company-address">{companyDetails.address}</p>
            )}

            {/* Show contact line only when at least one value is present */}
            {(companyDetails.phone || companyDetails.email) && (
              <p className="company-contact">
                {companyDetails.phone && `Phone: ${companyDetails.phone}`}
                {companyDetails.phone && companyDetails.email && " | "}
                {companyDetails.email && `Email: ${companyDetails.email}`}
              </p>
            )}

            {/* Show license row only when at least one value is present */}
            {(companyDetails.gstin || companyDetails.drugLicense) && (
              <div className="company-licenses">
                {companyDetails.gstin && (
                  <span>GSTIN: {companyDetails.gstin}</span>
                )}
                {companyDetails.drugLicense && (
                  <span>D.L. No: {companyDetails.drugLicense}</span>
                )}
              </div>
            )}
          </div>
          <div className="invoice-title">
            <h2>PURCHASE INVOICE</h2>
          </div>
        </header>

        {/* ── Invoice Details & Supplier Info ── */}
        <section className="invoice-details-section">
          <div className="details-grid">
            <div className="supplier-details">
              <h3>Supplier Details</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="label">Supplier Name:</td>
                    <td className="value">{supplier?.supplierName || "-"}</td>
                  </tr>
                  <tr>
                    <td className="label">Supplier GSTIN:</td>
                    <td className="value">{supplier?.supplierGST || "-"}</td>
                  </tr>
                  <tr>
                    <td className="label">Address:</td>
                    <td className="value">{supplier?.address || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="invoice-info">
              <h3>Invoice Details</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="label">Invoice No:</td>
                    <td className="value">
                      <strong>{displayInvoiceNumber}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Supplier Inv:</td>
                    <td className="value">{supplier?.invoiceNo || "-"}</td>
                  </tr>
                  <tr>
                    <td className="label">Date:</td>
                    <td className="value">{displayInvoiceDate}</td>
                  </tr>
                  <tr>
                    <td className="label">Time:</td>
                    <td className="value">{formatTime()}</td>
                  </tr>
                  <tr>
                    <td className="label">Created By:</td>
                    <td className="value">
                      <strong>{billedBy}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Items Table ── */}
        <section className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-sno">#</th>
                <th className="col-desc">Description of Goods</th>
                <th className="col-hsn">HSN</th>
                <th className="col-batch">Batch</th>
                <th className="col-exp">Exp</th>
                <th className="col-qty">Qty</th>
                <th className="col-mrp">MRP</th>
                <th className="col-rate">Rate</th>
                <th className="col-disc">Disc%</th>
                <th className="col-taxable">Taxable</th>
                <th className="col-gst">GST%</th>
                <th className="col-gstamt">GST Amt</th>
                <th className="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.length > 0 ? (
                dataRows.map((row, index) => {
                  const rowMrp = safeNumber(row.mrp);
                  const rowPrice = safeNumber(row.price);
                  const rowDiscount = safeNumber(row.discountPercent);
                  const rowTaxable = safeNumber(row.taxableValue);
                  const rowCgst = safeNumber(row.cgstPercent);
                  const rowSgst = safeNumber(row.sgstPercent);
                  const rowCgstAmount = safeNumber(row.cgstAmount);
                  const rowSgstAmount = safeNumber(row.sgstAmount);
                  const rowAmount = safeNumber(row.amount);
                  const rowQty = safeNumber(row.qty);

                  return (
                    <tr key={index}>
                      <td className="col-sno">{index + 1}</td>
                      <td className="col-desc">
                        <div className="product-name">{row.name || "-"}</div>
                        <div className="product-pack">
                          Pack: {row.pack || "-"}
                        </div>
                      </td>
                      <td className="col-hsn">{row.hsn || "-"}</td>
                      <td className="col-batch">{row.batch || "-"}</td>
                      <td className="col-exp">{row.exp || "-"}</td>
                      <td className="col-qty">{rowQty || 0}</td>
                      <td className="col-mrp">{rowMrp.toFixed(2)}</td>
                      <td className="col-rate">{rowPrice.toFixed(2)}</td>
                      <td className="col-disc">{rowDiscount.toFixed(2)}</td>
                      <td className="col-taxable">{rowTaxable.toFixed(2)}</td>
                      <td className="col-gst">
                        {(rowCgst + rowSgst).toFixed(0)}%
                      </td>
                      <td className="col-gstamt">
                        {(rowCgstAmount + rowSgstAmount).toFixed(2)}
                      </td>
                      <td className="col-amount">{rowAmount.toFixed(2)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="13"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#999",
                    }}
                  >
                    No items to display
                  </td>
                </tr>
              )}

              {/* Padding rows so short invoices still fill the table */}
              {dataRows.length > 0 &&
                dataRows.length < 5 &&
                [...Array(5 - dataRows.length)].map((_, i) => (
                  <tr key={`empty-${i}`} className="empty-row">
                    {[...Array(13)].map((__, j) => (
                      <td key={j}>&nbsp;</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        {/* ── Summary ── */}
        <section className="summary-section">
          <div className="summary-grid">
            <div className="amount-words">
              <h4>Amount in Words:</h4>
              <p>{numberToWords(safeSummary.total)}</p>
            </div>

            <div className="totals-box">
              <table className="totals-table">
                <tbody>
                  <tr>
                    <td className="label">Taxable Amount:</td>
                    <td className="value">
                      ₹ {safeSummary.subTotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="label">CGST:</td>
                    <td className="value">₹ {safeSummary.cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="label">SGST:</td>
                    <td className="value">₹ {safeSummary.sgst.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td className="label">Grand Total:</td>
                    <td className="value">₹ {safeSummary.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── GST Summary Table ── */}
        <section className="gst-summary-section">
          <h4>GST Summary</h4>
          <table className="gst-summary-table">
            <thead>
              <tr>
                <th>GST Rate</th>
                <th>Taxable Amount</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const gstGroups = {};
                dataRows.forEach((row) => {
                  const cgstRate = safeNumber(row.cgstPercent);
                  const sgstRate = safeNumber(row.sgstPercent);
                  const rate = cgstRate + sgstRate;

                  if (!gstGroups[rate]) {
                    gstGroups[rate] = { taxable: 0, cgst: 0, sgst: 0 };
                  }
                  gstGroups[rate].taxable += safeNumber(row.taxableValue);
                  gstGroups[rate].cgst += safeNumber(row.cgstAmount);
                  gstGroups[rate].sgst += safeNumber(row.sgstAmount);
                });

                const entries = Object.entries(gstGroups);
                if (entries.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", color: "#999" }}
                      >
                        -
                      </td>
                    </tr>
                  );
                }

                return entries.map(([rate, values]) => (
                  <tr key={rate}>
                    <td>{rate}%</td>
                    <td>₹ {values.taxable.toFixed(2)}</td>
                    <td>₹ {values.cgst.toFixed(2)}</td>
                    <td>₹ {values.sgst.toFixed(2)}</td>
                    <td>₹ {(values.cgst + values.sgst).toFixed(2)}</td>
                  </tr>
                ));
              })()}
              <tr className="total-row">
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>₹ {safeSummary.subTotal.toFixed(2)}</strong>
                </td>
                <td>
                  <strong>₹ {safeSummary.cgst.toFixed(2)}</strong>
                </td>
                <td>
                  <strong>₹ {safeSummary.sgst.toFixed(2)}</strong>
                </td>
                <td>
                  <strong>
                    ₹ {(safeSummary.cgst + safeSummary.sgst).toFixed(2)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── Payment Details ── */}
        <section className="payment-section">
          <div className="payment-grid">
            <div className="payment-info">
              <h4>Payment Details</h4>
              <table className="payment-table">
                <tbody>
                  <tr>
                    <td>Amount Paid:</td>
                    <td>
                      ₹ {safeNumber(supplier?.amountPaid || 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td>Balance:</td>
                    <td>
                      ₹{" "}
                      {safeNumber(
                        supplier?.balance || safeSummary.total,
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bank-details">
              <h4>Bank Details</h4>
              <p>Bank: State Bank of India</p>
              <p>A/C No: XXXXXXXXXXXX</p>
              <p>IFSC: SBIN0001234</p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="invoice-footer">
          <div className="footer-grid">
            <div className="terms">
              <h4>Terms & Conditions:</h4>
              <ol>
                <li>Goods once sold will not be taken back.</li>
                <li>
                  Interest @ 18% p.a. will be charged on delayed payments.
                </li>
                <li>Subject to local jurisdiction only.</li>
              </ol>
            </div>
            <div className="signature-box">
              <p
                className="billed-by-footer"
                style={{
                  fontSize: "9pt",
                  color: "#666",
                  marginBottom: "8px",
                  fontStyle: "italic",
                }}
              >
                Created By: <strong>{billedBy}</strong>
              </p>
              <div className="signature-line"></div>
              <p>Authorized Signatory</p>
              <p className="company-stamp">{companyDetails.name}</p>
            </div>
          </div>
        </footer>

        <div className="page-number">Page 1 of 1</div>
      </div>
    </div>
  );
};

export default PurchaseInvoicePrint;