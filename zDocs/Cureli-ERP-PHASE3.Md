<!-- zDocs/Cureli-ERP-PHASE3.Md (do not remove this comment) -->
# Cureli ERP — Reports Module

### Complete Feature Overview

---

## SECTION A — SALES REPORTS

### A1. Sales Summary

A morning-check overview of your sales performance for any period.

See total invoices raised, gross sales, discounts given, GST collected (CGST + SGST), net sales after returns, and a comparison against the previous period.

**Filters:** Date range · Branch · Payment status · Payment mode
**Export:** PDF · Excel · CSV · Print

---

### A2. Sales Register

The complete invoice-by-invoice sales record for any period.

See invoice number and date, customer name or walk-in label, item count, subtotal, discount, tax, net amount, payment status and mode, and the staff member who created each invoice.

**Filters:** Date range · Branch · Customer · Payment status · Staff member
**Export:** PDF · Excel · CSV · Print

---

### A3. Sales Profit Report

Shows the actual profit made on every sale — the most requested financial report by pharmacy owners.

See medicine name, quantity sold, purchase rate (cost), selling rate (revenue), gross profit per unit, total gross profit, and margin %.

> Profit is calculated using the last recorded purchase rate for each medicine against the actual selling rate on the invoice.

**Filters:** Date range · Branch · Category · Manufacturer
**Sort by:** Profit amount · Margin %
**Export:** PDF · Excel · CSV · Print

---

### A4. Sales Returns

All return invoices — what was returned, why, and what was refunded.

See return invoice number, original invoice it was raised against, date, customer, return reason, approval status, refund amount, and refund mode.

**Filters:** Date range · Branch · Return reason · Approval status
**Export:** PDF · Excel · CSV · Print

---

### A5. Payment Collection

All payments received against sales invoices.

See payment date, invoice number, customer name, amount received, payment mode, reference number, and status.

**Filters:** Date range · Branch · Payment mode · Customer
**Export:** PDF · Excel · CSV · Print

---

### A6. Sales Outstanding & Receivables

All invoices where payment has not been fully received, with aging.

See invoice number, date, due date, customer, net amount, amount paid, balance due, and days overdue — grouped into aging buckets: current, 1–30 days, 31–60 days, 61–90 days, and 90+ days overdue.

**Filters:** Branch · Customer · Aging bucket
**Export:** PDF · Excel · CSV · Print

---

### A7. Day Book

A complete financial snapshot of a single day — total invoices raised, cash sales, credit sales, returns, payments received, and net cash collected.

**Filters:** Date · Branch
**Export:** PDF · Print

---

---

## SECTION B — PURCHASE REPORTS

### B1. Purchase Register

Every confirmed purchase invoice in the selected period.

See invoice number, supplier invoice number, date, supplier, item count, subtotal, discount, GST, net amount, and payment status.

**Filters:** Date range · Branch · Supplier · Payment status
**Export:** PDF · Excel · CSV · Print

---

### B2. Purchase Outstanding & Payables

All purchase invoices with pending payment, with aging.

See invoice number, date, due date, supplier, net amount, amount paid, balance due, and days overdue — grouped into aging buckets: current, 1–30 days, 31–60 days, 61–90 days, and 90+ days overdue.

**Filters:** Branch · Supplier · Aging bucket
**Export:** PDF · Excel · CSV · Print

---

### B3. Purchase Returns

All purchase return invoices — what was returned to suppliers and why.

See return invoice number, original invoice, supplier, return reason, approval status, credit note number, and refund amount.

**Filters:** Date range · Supplier · Approval status · Return reason
**Export:** PDF · Excel · CSV · Print

---

---

## SECTION C — INVENTORY & STOCK REPORTS

### C1. Current Stock

A complete snapshot of everything currently in stock.

See medicine name, manufacturer, category, batch number, expiry date, current stock, available stock, reserved stock, MRP, selling rate, and rack number.

**Filters:** Branch · Category · Manufacturer · Stock level
**Export:** PDF · Excel · CSV · Print

---

### C2. Expiry Report

All inventory grouped by how urgently it needs attention.

See medicine name, batch, expiry date, current stock quantity, and MRP value at risk — color-coded across buckets: already expired, expiring within 30 days, 31–60 days, 61–90 days, 91–180 days, and safe.

**Filters:** Branch · Expiry bucket · Manufacturer
**Export:** PDF · Excel · CSV · Print

---

### C3. Min Stock & Reorder

Medicines that have fallen below their minimum stock level and need reordering immediately.

See medicine name, manufacturer, minimum level set, reorder point, current total stock, shortage quantity, last purchase date and rate, and last supplier used.

**Filters:** Branch · Category · Manufacturer
**Export:** PDF · Excel · CSV · Print

---

### C4. Dead Stock & Non-Moving

Medicines that have stock but have not been sold in a configurable number of days — capital locked in inventory that may eventually expire.

See medicine name, manufacturer, current stock quantity, stock value, last sale date, and days since last sale.

**Threshold:** 30 / 60 / 90 / 180 days (selectable)

**Filters:** Branch · Days threshold · Category
**Export:** PDF · Excel · CSV · Print

---

### C5. Stock Adjustment

All manual stock adjustments — what was changed, why, and by whom.

See date, medicine and batch, old quantity, new quantity, variance, reason for adjustment, adjusted by, and approved by.

**Filters:** Date range · Branch · Reason type · Staff member
**Export:** PDF · Excel · CSV · Print

---

---

## SECTION D — GST REPORTS

### D1. GSTR-1 — Outward Supply

All sales data organized for GST return filing.

**B2B section:** Sales to customers with GSTIN — customer GSTIN, invoice number, date, taxable amount, CGST, SGST, total.
**B2C section:** Retail sales without GSTIN — invoice number, date, taxable amount, tax breakdown, total.
**HSN-wise summary:** HSN code, unit, total quantity, taxable value, CGST, SGST, total tax.

**Filters:** Month · Quarter · Branch
**Export:** PDF · Excel · CSV

---

### D2. GSTR-2 — Inward Supply & Input Tax Credit

All purchases organized for input tax credit claim.

See supplier GSTIN, invoice number, date, taxable amount, CGST paid, SGST paid, IGST paid, and total ITC eligible.

**Filters:** Month · Quarter · Branch · Supplier
**Export:** PDF · Excel · CSV

---

### D3. GSTR-3B Summary

Monthly GST liability summary — total output tax collected, total input credit available, and net GST payable.

**Filters:** Month · Branch
**Export:** PDF · Excel · Print

---

---

## SECTION E — FINANCIAL REPORTS

### E1. Profit & Loss — Medicine-wise

Gross profit analysis per medicine — which products are making you money and which are not.

See medicine name, category, quantity sold, total revenue, total cost, gross profit, and gross margin %.

**Filters:** Date range · Branch · Category · Manufacturer
**Sort by:** Profit amount · Margin % · Revenue
**Export:** PDF · Excel · CSV · Print

---

### E2. Profit & Loss — Period-wise

Overall pharmacy gross profit summarized by time period.

See total revenue, total cost of goods sold, gross profit, gross margin %, and a month-by-month or week-by-week trend.

**Filters:** Date range · Branch
**Export:** PDF · Excel · Print

---

---

## SECTION F — MARKETPLACE REPORTS

### F1. Marketplace Sales Summary

High-level overview of all marketplace orders for any period.

See total orders placed, total revenue, average order value, branch-wise revenue contribution, and comparison with the previous period.

**Filters:** Date range · Branch · Order status · Payment method
**Export:** PDF · Excel · CSV

---

### F2. Order Status Funnel

Where are orders dropping off in your fulfillment pipeline?

See counts and percentages at every stage — placed, accepted, ready, completed, rejected, and cancelled — with a branch-wise breakdown.

**Filters:** Date range · Branch
**Export:** PDF · Excel

---

### F3. Acceptance Rate

How often and how reliably your branches accept incoming orders.

See total placed, accepted count and %, rejected count and %, cancelled count and %, and branch-wise acceptance rate over time.

**Filters:** Date range · Branch
**Export:** PDF · Excel · CSV

---

### F4. Prescription Request Summary

Overview of all prescription requests routed to your pharmacy.

See total requests received, quotes sent, quotes accepted, converted to order, declined, and expired — plus overall conversion rate.

**Filters:** Date range · Branch
**Export:** PDF · Excel · CSV

---

### F5. Listing Health

A per-branch catalog health check — are you maximizing your marketplace presence?

See per branch: total linked medicines, total listed, total visible, total out of stock, total prescription-required, and total with zero orders in the selected period.

**Filters:** Branch · Date range
**Export:** PDF · Excel

---

## Export Formats

Every report supports the following formats:

| Format            | Best for                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| **PDF**           | Sharing, printing, and record-keeping. Includes pharmacy name and report header |
| **Excel (.xlsx)** | Further analysis, filtering, and pivot tables with properly typed columns       |
| **CSV**           | Importing into other software or accounting tools                               |
| **Print**         | Direct browser print with a clean, optimized layout                             |

Every report also includes a **date range preset selector** — Today, Yesterday, This Week, This Month, This Quarter, This Year, and Custom Range — along with a **branch filter** and a **totals summary row** at the bottom of every table.

---

## Report Count

| Section               | Count          |
| --------------------- | -------------- |
| A — Sales             | 7              |
| B — Purchase          | 3              |
| C — Inventory & Stock | 5              |
| D — GST               | 3              |
| E — Financial         | 2              |
| G — Marketplace       | 5              |
| **Total**             | **25 reports** |

---
