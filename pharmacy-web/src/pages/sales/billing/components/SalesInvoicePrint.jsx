// pharmacy-web/src/pages/sales/billing/components/SalesInvoicePrint.jsx (do not remove this comment)
// src/pages/sales/billing/components/SalesInvoicePrint.jsx

import { useMemo } from "react";

const SalesInvoicePrint = ({
  rows,
  customer,
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
  showDiscount = true,
}) => {
  const dataRows = rows.filter(
    (row) => row.name && row.name.trim() !== "" && row.qty,
  );

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString("en-IN");
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = () => {
    return new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Number to words converter (Indian system)
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

    if (num === 0) return "Zero Rupees Only";

    const intPart = Math.floor(num);
    const crore = Math.floor(intPart / 10000000);
    const lakh = Math.floor((intPart % 10000000) / 100000);
    const thousand = Math.floor((intPart % 100000) / 1000);
    const hundred = Math.floor(intPart % 1000);
    const paise = Math.round((num % 1) * 100);

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

  const displayInvoiceNumber = invoiceNumber || "DRAFT";
  const displayInvoiceDate = formatDate(invoiceDate);
  const netAmount = summary?.netAmount || 0;
  const cashReceived = parseFloat(customer?.cashReceived) || 0;
  const balance = netAmount - cashReceived;

  const totalColumns = showDiscount ? 8 : 7;

  return (
    <div className="print-container">
      <div
        className="a4-page"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "8mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "10pt",
          color: "#000",
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {/* ============================================ */}
        {/* HEADER SECTION */}
        {/* ============================================ */}
        <header
          style={{
            borderBottom: "2px solid #05015A",
            paddingBottom: "8px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            {/* Company Info */}
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: "18pt",
                  fontWeight: "bold",
                  color: "#05015A",
                  margin: "0 0 4px 0",
                }}
              >
                {companyDetails.name}
              </h1>

              {/* Address */}
              {companyDetails.address && (
                <p
                  style={{ margin: "2px 0", fontSize: "9pt", color: "#333" }}
                >
                  {companyDetails.address}
                </p>
              )}

              {/* Phone / Email */}
              {(companyDetails.phone || companyDetails.email) && (
                <p
                  style={{ margin: "2px 0", fontSize: "9pt", color: "#333" }}
                >
                  {companyDetails.phone && `Phone: ${companyDetails.phone}`}
                  {companyDetails.phone && companyDetails.email && " | "}
                  {companyDetails.email && `Email: ${companyDetails.email}`}
                </p>
              )}

              {/* GSTIN / Drug License */}
              {(companyDetails.gstin || companyDetails.drugLicense) && (
                <div
                  style={{ marginTop: "4px", fontSize: "8pt", color: "#666" }}
                >
                  {companyDetails.gstin && (
                    <span style={{ marginRight: "16px" }}>
                      GSTIN: <strong>{companyDetails.gstin}</strong>
                    </span>
                  )}
                  {companyDetails.drugLicense && (
                    <span>
                      D.L. No: <strong>{companyDetails.drugLicense}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Title */}
            <div style={{ textAlign: "right" }}>
              <h2
                style={{
                  fontSize: "14pt",
                  fontWeight: "bold",
                  color: "#05015A",
                  margin: "0",
                  padding: "6px 12px",
                  border: "2px solid #05015A",
                  borderRadius: "4px",
                }}
              >
                TAX INVOICE
              </h2>
              <p
                style={{ fontSize: "8pt", color: "#666", marginTop: "4px" }}
              >
                (Original for Recipient)
              </p>
            </div>
          </div>
        </header>

        {/* ============================================ */}
        {/* INVOICE & CUSTOMER DETAILS */}
        {/* ============================================ */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "12px",
            fontSize: "9pt",
          }}
        >
          {/* Customer Details */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "10px",
              background: "#fafafa",
            }}
          >
            <h3
              style={{
                fontSize: "9pt",
                fontWeight: "bold",
                color: "#05015A",
                margin: "0 0 8px 0",
                borderBottom: "1px solid #ddd",
                paddingBottom: "4px",
              }}
            >
              Customer Details
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "2px 0",
                      color: "#666",
                      width: "90px",
                    }}
                  >
                    Name:
                  </td>
                  <td style={{ padding: "2px 0", fontWeight: "600" }}>
                    {customer?.customer_id
                      ? (customer?.name || "Customer")
                      : (customer?.name || customer?.patientName)
                        ? `Walk-in Customer: ${customer?.name || customer?.patientName}`
                        : "Walk-in Customer"}
                  </td>
                </tr>
                {customer?.phone && (
                  <tr>
                    <td style={{ padding: "2px 0", color: "#666" }}>
                      Mobile:
                    </td>
                    <td style={{ padding: "2px 0" }}>{customer.phone}</td>
                  </tr>
                )}
                {customer?.address && (
                  <tr>
                    <td style={{ padding: "2px 0", color: "#666" }}>
                      Address:
                    </td>
                    <td style={{ padding: "2px 0" }}>{customer.address}</td>
                  </tr>
                )}
                {customer?.gstNumber && (
                  <tr>
                    <td style={{ padding: "2px 0", color: "#666" }}>
                      GSTIN:
                    </td>
                    <td
                      style={{
                        padding: "2px 0",
                        fontFamily: "monospace",
                      }}
                    >
                      {customer.gstNumber}
                    </td>
                  </tr>
                )}
                {customer?.doctorName && (
                  <tr>
                    <td style={{ padding: "2px 0", color: "#666" }}>
                      Doctor:
                    </td>
                    <td style={{ padding: "2px 0" }}>
                      Dr. {customer.doctorName}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Invoice Details */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "10px",
              background: "#fafafa",
            }}
          >
            <h3
              style={{
                fontSize: "9pt",
                fontWeight: "bold",
                color: "#05015A",
                margin: "0 0 8px 0",
                borderBottom: "1px solid #ddd",
                paddingBottom: "4px",
              }}
            >
              Invoice Details
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "2px 0",
                      color: "#666",
                      width: "100px",
                    }}
                  >
                    Invoice No:
                  </td>
                  <td
                    style={{
                      padding: "2px 0",
                      fontWeight: "bold",
                      fontSize: "11pt",
                      color: "#05015A",
                    }}
                  >
                    {displayInvoiceNumber}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", color: "#666" }}>Date:</td>
                  <td style={{ padding: "2px 0", fontWeight: "600" }}>
                    {displayInvoiceDate}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", color: "#666" }}>Time:</td>
                  <td style={{ padding: "2px 0" }}>{formatTime()}</td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", color: "#666" }}>
                    Billed By:
                  </td>
                  <td
                    style={{
                      padding: "2px 0",
                      fontWeight: "600",
                      color: "#7c3aed",
                    }}
                  >
                    {billedBy}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", color: "#666" }}>
                    Payment:
                  </td>
                  <td style={{ padding: "2px 0" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "8pt",
                        fontWeight: "600",
                        background:
                          customer?.paymentType === "CREDIT"
                            ? "#fef3c7"
                            : "#d1fae5",
                        color:
                          customer?.paymentType === "CREDIT"
                            ? "#92400e"
                            : "#065f46",
                      }}
                    >
                      {customer?.paymentType || "CASH"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================ */}
        {/* ITEMS TABLE */}
        {/* ============================================ */}
        <section style={{ marginBottom: "12px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "8pt",
              border: "1px solid #333",
            }}
          >
            <thead>
              <tr style={{ background: "#05015A", color: "#fff" }}>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "center",
                    borderRight: "1px solid #fff",
                    width: "25px",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "left",
                    borderRight: "1px solid #fff",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "center",
                    borderRight: "1px solid #fff",
                    width: "55px",
                  }}
                >
                  Batch
                </th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "center",
                    borderRight: "1px solid #fff",
                    width: "40px",
                  }}
                >
                  Exp
                </th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "center",
                    borderRight: "1px solid #fff",
                    width: "35px",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "right",
                    borderRight: "1px solid #fff",
                    width: "50px",
                  }}
                >
                  MRP
                </th>
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "right",
                    borderRight: "1px solid #fff",
                    width: "50px",
                  }}
                >
                  Rate
                </th>
                {showDiscount && (
                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "center",
                      borderRight: "1px solid #fff",
                      width: "35px",
                    }}
                  >
                    Disc%
                  </th>
                )}
                <th
                  style={{
                    padding: "6px 4px",
                    textAlign: "right",
                    width: "55px",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {dataRows.length > 0 ? (
                dataRows.map((row, index) => (
                  <tr
                    key={index}
                    style={{ borderBottom: "1px solid #ddd" }}
                  >
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "center",
                        borderRight: "1px solid #ddd",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        padding: "5px 4px",
                        borderRight: "1px solid #ddd",
                      }}
                    >
                      <div style={{ fontWeight: "600" }}>{row.name}</div>
                      {row.manufacturer && (
                        <div style={{ fontSize: "7pt", color: "#666" }}>
                          {row.manufacturer}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "center",
                        borderRight: "1px solid #ddd",
                        fontFamily: "monospace",
                        fontSize: "7pt",
                      }}
                    >
                      {row.batch || "-"}
                    </td>
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "center",
                        borderRight: "1px solid #ddd",
                        fontSize: "7pt",
                      }}
                    >
                      {row.exp || "-"}
                    </td>
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "center",
                        borderRight: "1px solid #ddd",
                        fontWeight: "600",
                      }}
                    >
                      {row.qty || 0}
                    </td>
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "right",
                        borderRight: "1px solid #ddd",
                      }}
                    >
                      {Number(row.mrp || 0).toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "right",
                        borderRight: "1px solid #ddd",
                      }}
                    >
                      {Number(row.rate || row.mrp || 0).toFixed(2)}
                    </td>
                    {showDiscount && (
                      <td
                        style={{
                          padding: "5px 4px",
                          textAlign: "center",
                          borderRight: "1px solid #ddd",
                          color:
                            parseFloat(row.discountPercent) > 0
                              ? "#dc2626"
                              : "inherit",
                        }}
                      >
                        {Number(row.discountPercent || 0).toFixed(1)}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "right",
                        fontWeight: "600",
                      }}
                    >
                      {Number(row.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={totalColumns}
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#999",
                    }}
                  >
                    No items
                  </td>
                </tr>
              )}

              {/* Padding rows */}
              {dataRows.length > 0 &&
                dataRows.length < 5 &&
                [...Array(5 - dataRows.length)].map((_, i) => (
                  <tr
                    key={`empty-${i}`}
                    style={{
                      height: "24px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {[...Array(totalColumns)].map((__, j) => (
                      <td
                        key={j}
                        style={{
                          borderRight: j < totalColumns - 1 ? "1px solid #eee" : "none",
                        }}
                      >
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        {/* ============================================ */}
        {/* SUMMARY SECTION */}
        {/* ============================================ */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 250px",
            gap: "16px",
            marginBottom: "12px",
          }}
        >
          {/* Amount in Words */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "10px",
              background: "#f8fafc",
            }}
          >
            <h4
              style={{
                fontSize: "8pt",
                color: "#666",
                margin: "0 0 4px 0",
              }}
            >
              Amount in Words:
            </h4>
            <p
              style={{
                fontSize: "10pt",
                fontWeight: "600",
                margin: 0,
                color: "#1e293b",
              }}
            >
              {numberToWords(netAmount)}
            </p>
          </div>

          {/* Totals Box */}
          <div
            style={{
              border: "1px solid #05015A",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9pt",
              }}
            >
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 10px", color: "#64748b" }}>
                    Sub Total:
                  </td>
                  <td
                    style={{
                      padding: "6px 10px",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    ₹ {(summary?.subtotal || 0).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 10px", color: "#64748b" }}>
                    Taxable Amt:
                  </td>
                  <td
                    style={{
                      padding: "6px 10px",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    ₹ {(summary?.taxableAmount || 0).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 10px", color: "#64748b" }}>
                    CGST:
                  </td>
                  <td style={{ padding: "6px 10px", textAlign: "right" }}>
                    ₹ {(summary?.cgstAmount || 0).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 10px", color: "#64748b" }}>
                    SGST:
                  </td>
                  <td style={{ padding: "6px 10px", textAlign: "right" }}>
                    ₹ {(summary?.sgstAmount || 0).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ background: "#05015A", color: "#fff" }}>
                  <td
                    style={{
                      padding: "8px 10px",
                      fontWeight: "bold",
                      fontSize: "10pt",
                    }}
                  >
                    Net Amount:
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "right",
                      fontWeight: "bold",
                      fontSize: "12pt",
                    }}
                  >
                    ₹ {netAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================ */}
        {/* PAYMENT DETAILS */}
        {/* ============================================ */}
        {cashReceived > 0 && (
          <section
            style={{
              marginBottom: "12px",
              padding: "10px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "4px",
              fontSize: "9pt",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ color: "#166534" }}>Cash Received: </span>
                <strong style={{ color: "#166534" }}>
                  ₹ {cashReceived.toFixed(2)}
                </strong>
              </div>
              <div>
                <span
                  style={{ color: balance > 0 ? "#92400e" : "#166534" }}
                >
                  {balance > 0
                    ? "Balance Due: "
                    : balance < 0
                      ? "Return Change: "
                      : "Settled"}
                </span>
                {balance !== 0 && (
                  <strong
                    style={{
                      color: balance > 0 ? "#92400e" : "#166534",
                    }}
                  >
                    ₹ {Math.abs(balance).toFixed(2)}
                  </strong>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================ */}
        {/* FOOTER SECTION */}
        {/* ============================================ */}
        <footer
          style={{
            marginTop: "auto",
            borderTop: "1px solid #ddd",
            paddingTop: "12px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            fontSize: "8pt",
          }}
        >
          {/* Terms & Conditions */}
          <div>
            <h4
              style={{
                fontSize: "8pt",
                fontWeight: "bold",
                color: "#374151",
                margin: "0 0 6px 0",
              }}
            >
              Terms & Conditions:
            </h4>
            <ol
              style={{
                margin: 0,
                paddingLeft: "14px",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              <li>
                Goods once sold will not be taken back except for
                manufacturing defects.
              </li>
              <li>Please check the expiry date before use.</li>
              <li>Keep medicines out of reach of children.</li>
              <li>Store as per the instructions on the label.</li>
            </ol>
          </div>

          {/* Signature Box */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-block",
                textAlign: "center",
                minWidth: "150px",
              }}
            >
              <p
                style={{
                  fontSize: "8pt",
                  color: "#666",
                  marginBottom: "6px",
                  fontStyle: "italic",
                }}
              >
                Prepared By:{" "}
                <strong style={{ color: "#7c3aed" }}>{billedBy}</strong>
              </p>
              <div
                style={{
                  borderBottom: "1px solid #000",
                  height: "35px",
                  marginBottom: "4px",
                }}
              ></div>
              <p
                style={{ margin: "0", fontWeight: "600", color: "#374151" }}
              >
                Authorized Signatory
              </p>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "7pt",
                  color: "#6b7280",
                }}
              >
                {companyDetails.name}
              </p>
            </div>
          </div>
        </footer>

        {/* Page Number */}
        <div
          style={{
            textAlign: "center",
            marginTop: "12px",
            fontSize: "7pt",
            color: "#9ca3af",
          }}
        >
          Page 1 of 1 | Generated on {new Date().toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
};

export default SalesInvoicePrint; 