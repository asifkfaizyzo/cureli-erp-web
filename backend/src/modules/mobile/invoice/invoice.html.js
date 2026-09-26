// backend/src/modules/mobile/invoice/invoice.html.js (do not remove this comment)
// backend/src/modules/mobile/invoice/invoice.html.js

import { CURELI_COMPANY } from '../../../config/cureli.js';

// ── Number to words (Indian system) ─────────────────────────
function numberToWords(num) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  const convert = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+convert(n%100) : '');
  };

  if (!num || num === 0) return 'Zero Rupees Only';
  const int = Math.floor(num);
  const cr = Math.floor(int/10000000);
  const lk = Math.floor((int%10000000)/100000);
  const th = Math.floor((int%100000)/1000);
  const hd = int%1000;
  const ps = Math.round((num%1)*100);

  let r = '';
  if (cr>0) r += convert(cr)+' Crore ';
  if (lk>0) r += convert(lk)+' Lakh ';
  if (th>0) r += convert(th)+' Thousand ';
  if (hd>0) r += convert(hd);
  r = r.trim()+' Rupees';
  if (ps>0) r += ' and '+convert(ps)+' Paise';
  return r+' Only';
}

function fmt(n) { return Number(n||0).toFixed(2); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'});
}

// ── Shared CSS ──────────────────────────────────────────────
const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size:10pt; color:#000; }
  .page { width:210mm; min-height:297mm; padding:8mm; background:#fff; position:relative; }
  .page-break { page-break-before:always; }

  .header { border-bottom:2px solid #05015A; padding-bottom:8px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:flex-start; }
  .company-name { font-size:18pt; font-weight:bold; color:#05015A; margin:0 0 4px 0; }
  .company-meta { font-size:9pt; color:#333; margin:2px 0; }
  .company-license { font-size:8pt; color:#666; margin-top:4px; }
  .invoice-title-box { text-align:right; }
  .invoice-title { font-size:14pt; font-weight:bold; color:#05015A; padding:6px 12px; border:2px solid #05015A; border-radius:4px; display:inline-block; }
  .invoice-subtitle { font-size:8pt; color:#666; margin-top:4px; }
  .channel-badge { display:inline-block; font-size:7pt; padding:2px 8px; border-radius:10px; margin-top:4px; }
  .channel-marketplace { background:#e0e7ff; color:#3730a3; }

  .details-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:12px; font-size:9pt; }
  .detail-box { border:1px solid #ddd; border-radius:4px; padding:10px; background:#fafafa; }
  .detail-title { font-size:9pt; font-weight:bold; color:#05015A; margin:0 0 8px 0; border-bottom:1px solid #ddd; padding-bottom:4px; }
  .detail-row { display:flex; justify-content:space-between; padding:2px 0; }
  .detail-label { color:#666; }
  .detail-value { font-weight:600; }
  .detail-value-lg { font-weight:bold; font-size:11pt; color:#05015A; }

  .items-table { width:100%; border-collapse:collapse; font-size:8pt; border:1px solid #333; margin-bottom:12px; }
  .items-table th { background:#05015A; color:#fff; padding:6px 4px; text-align:center; border-right:1px solid rgba(255,255,255,0.3); }
  .items-table th:last-child { border-right:none; }
  .items-table td { padding:5px 4px; border-bottom:1px solid #ddd; border-right:1px solid #ddd; }
  .items-table td:last-child { border-right:none; }
  .items-table .text-left { text-align:left; }
  .items-table .text-right { text-align:right; }
  .items-table .text-center { text-align:center; }
  .items-table .font-bold { font-weight:600; }
  .items-table .font-mono { font-family:monospace; font-size:7pt; }
  .items-table .mfr { font-size:7pt; color:#666; }

  .summary-grid { display:grid; grid-template-columns:1fr 250px; gap:16px; margin-bottom:12px; }
  .words-box { border:1px solid #ddd; border-radius:4px; padding:10px; background:#f8fafc; }
  .words-label { font-size:8pt; color:#666; margin-bottom:4px; }
  .words-value { font-size:10pt; font-weight:600; color:#1e293b; }
  .totals-box { border:1px solid #05015A; border-radius:4px; overflow:hidden; }
  .totals-table { width:100%; border-collapse:collapse; font-size:9pt; }
  .totals-table td { padding:6px 10px; }
  .totals-table .label { color:#64748b; }
  .totals-table .value { text-align:right; font-weight:500; }
  .totals-table .row-divider { border-bottom:1px solid #e2e8f0; }
  .totals-table .total-row td { background:#05015A; color:#fff; font-weight:bold; }
  .totals-table .total-row .label { font-size:10pt; }
  .totals-table .total-row .value { font-size:12pt; }

  .gst-table { width:100%; border-collapse:collapse; font-size:8pt; border:1px solid #ddd; margin-bottom:12px; }
  .gst-table th { background:#f1f5f9; padding:5px 8px; border-bottom:1px solid #ddd; border-right:1px solid #ddd; }
  .gst-table td { padding:5px 8px; border-bottom:1px solid #eee; border-right:1px solid #eee; }
  .gst-table .text-right { text-align:right; }
  .gst-table .text-center { text-align:center; }
  .gst-table .total-row { background:#f8fafc; font-weight:bold; border-top:1px solid #ddd; }

  .footer { border-top:1px solid #ddd; padding-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:20px; font-size:8pt; margin-top:auto; }
  .terms-title { font-weight:bold; color:#374151; margin-bottom:6px; }
  .terms-list { margin:0; padding-left:14px; color:#6b7280; line-height:1.5; }
  .sig-box { text-align:right; }
  .sig-line { border-bottom:1px solid #000; height:35px; margin-bottom:4px; width:150px; display:inline-block; }
  .sig-label { font-weight:600; color:#374151; }

  .page-num { text-align:center; font-size:7pt; color:#9ca3af; margin-top:12px; }

  /* ── Page 2 (Cureli) ─── */
  .cureli-header { background:linear-gradient(135deg,#05015A,#0a0280); color:#fff; padding:16px 20px; border-radius:8px; margin-bottom:16px; }
  .cureli-name { font-size:16pt; font-weight:bold; }
  .cureli-meta { font-size:9pt; opacity:0.8; margin-top:4px; }
  .charges-table { width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:16px; }
  .charges-table td { padding:10px 16px; border-bottom:1px solid #e2e8f0; }
  .charges-table .label { color:#64748b; }
  .charges-table .value { text-align:right; font-weight:500; }
  .charges-table .grand td { background:#f0fdf4; font-weight:bold; font-size:12pt; color:#166534; border:2px solid #bbf7d0; }
  .paid-badge { display:inline-block; background:#d1fae5; color:#065f46; font-size:9pt; font-weight:600; padding:4px 12px; border-radius:20px; }
`;

// ════════════════════════════════════════════════════════════
// PAGE 1: SHOP TAX INVOICE
// ════════════════════════════════════════════════════════════

function renderPage1({ shop, branch, order, invoice, items, gstSummary }) {
  const addr = [branch.address_line_1, branch.city, branch.state, branch.pincode].filter(Boolean).join(', ');

  const itemRows = items.map((item, i) => {
    const gstPct = Number(item.cgst_percent||0) + Number(item.sgst_percent||0);
    return `
      <tr>
        <td class="text-center">${i+1}</td>
        <td class="text-left">
          <div class="font-bold">${item.medicine_name||''}</div>
          ${item.manufacturer ? `<div class="mfr">${item.manufacturer}</div>` : ''}
        </td>
        <td class="text-center font-mono">${item.hsn_code||'—'}</td>
        <td class="text-center font-mono">${item.batch_number||'—'}</td>
        <td class="text-center" style="font-size:7pt">${item.expiry_display||'—'}</td>
        <td class="text-center font-bold">${item.quantity}</td>
        <td class="text-right">${fmt(item.mrp)}</td>
        <td class="text-right">${fmt(item.selling_rate)}</td>
        <td class="text-center">${fmt(item.discount_percent)}</td>
        <td class="text-right">${fmt(item.taxable_amount)}</td>
        <td class="text-center">${gstPct.toFixed(0)}%</td>
        <td class="text-right font-bold">${fmt(item.line_total)}</td>
      </tr>`;
  }).join('');

  const gstRows = Object.entries(gstSummary).map(([rate, v]) => `
    <tr>
      <td class="text-center">${rate}%</td>
      <td class="text-right">₹ ${fmt(v.taxable)}</td>
      <td class="text-right">₹ ${fmt(v.cgst)}</td>
      <td class="text-right">₹ ${fmt(v.sgst)}</td>
      <td class="text-right" style="font-weight:600">₹ ${fmt(v.cgst+v.sgst)}</td>
    </tr>
  `).join('');

  const deliveryAddr = order.delivery_address_snapshot;
  const addrText = deliveryAddr ? [
    deliveryAddr.address_line_1, deliveryAddr.address_line_2,
    deliveryAddr.landmark, deliveryAddr.city, deliveryAddr.state, deliveryAddr.pincode,
  ].filter(Boolean).join(', ') : '—';

  return `
    <div class="page">
      <!-- Header -->
      <div class="header">
        <div>
          <h1 class="company-name">${shop.business_name || shop.legal_name || 'Pharmacy'}</h1>
          ${addr ? `<p class="company-meta">${addr}</p>` : ''}
          ${branch.contact_number ? `<p class="company-meta">Phone: ${branch.contact_number}</p>` : ''}
          ${shop.gst_number ? `<div class="company-license">GSTIN: <strong>${shop.gst_number}</strong></div>` : ''}
        </div>
        <div class="invoice-title-box">
          <div class="invoice-title">TAX INVOICE</div>
          <div class="invoice-subtitle">(Original for Recipient)</div>
          <div class="channel-badge channel-marketplace">Marketplace Delivery</div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="details-grid">
        <div class="detail-box">
          <div class="detail-title">Customer Details</div>
          <div class="detail-row"><span class="detail-label">Name:</span><span class="detail-value">${order.customer_name_snapshot||'Customer'}</span></div>
          <div class="detail-row"><span class="detail-label">Phone:</span><span>${order.customer_phone_snapshot||'—'}</span></div>
          <div class="detail-row"><span class="detail-label">Address:</span><span style="max-width:200px;text-align:right">${addrText}</span></div>
          ${order.patient_name_snapshot ? `<div class="detail-row"><span class="detail-label">Patient:</span><span>${order.patient_name_snapshot}${order.patient_age_snapshot ? ', '+order.patient_age_snapshot+' yrs' : ''}</span></div>` : ''}
        </div>
        <div class="detail-box">
          <div class="detail-title">Invoice Details</div>
          <div class="detail-row"><span class="detail-label">Invoice No:</span><span class="detail-value-lg">${invoice.invoice_number}</span></div>
          <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${fmtDate(invoice.invoice_date)}</span></div>
          <div class="detail-row"><span class="detail-label">Order Ref:</span><span style="font-family:monospace;font-weight:600;color:#7c3aed">${order.order_number}</span></div>
          <div class="detail-row"><span class="detail-label">Payment:</span><span><span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:4px;font-size:8pt;font-weight:600">PREPAID</span></span></div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:25px">#</th>
            <th style="text-align:left">Description</th>
            <th style="width:50px">HSN</th>
            <th style="width:55px">Batch</th>
            <th style="width:40px">Exp</th>
            <th style="width:35px">Qty</th>
            <th style="width:50px">MRP</th>
            <th style="width:50px">Rate</th>
            <th style="width:35px">Disc%</th>
            <th style="width:55px">Taxable</th>
            <th style="width:35px">GST%</th>
            <th style="width:55px">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Summary -->
      <div class="summary-grid">
        <div class="words-box">
          <div class="words-label">Amount in Words:</div>
          <div class="words-value">${numberToWords(Number(invoice.net_amount))}</div>
        </div>
        <div class="totals-box">
          <table class="totals-table">
            <tbody>
              <tr class="row-divider"><td class="label">Sub Total:</td><td class="value">₹ ${fmt(invoice.subtotal)}</td></tr>
              <tr class="row-divider"><td class="label">Taxable Amount:</td><td class="value">₹ ${fmt(invoice.taxable_amount)}</td></tr>
              <tr class="row-divider"><td class="label">CGST:</td><td class="value">₹ ${fmt(invoice.cgst_amount)}</td></tr>
              <tr class="row-divider"><td class="label">SGST:</td><td class="value">₹ ${fmt(invoice.sgst_amount)}</td></tr>
              ${Number(invoice.round_off||0) !== 0 ? `<tr class="row-divider"><td class="label" style="font-size:8pt;color:#94a3b8">Round Off:</td><td class="value" style="font-size:8pt;color:#94a3b8">${Number(invoice.round_off)>=0?'+':''}₹ ${fmt(invoice.round_off)}</td></tr>` : ''}
              <tr class="total-row"><td class="label">Net Amount:</td><td class="value">₹ ${fmt(invoice.net_amount)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- GST Summary -->
      <div style="margin-bottom:12px">
        <h4 style="font-size:9pt;font-weight:bold;color:#05015A;margin-bottom:6px">GST Summary</h4>
        <table class="gst-table">
          <thead><tr><th class="text-center">GST Rate</th><th class="text-right">Taxable Amount</th><th class="text-right">CGST</th><th class="text-right">SGST</th><th class="text-right">Total Tax</th></tr></thead>
          <tbody>
            ${gstRows}
            <tr class="total-row">
              <td class="text-center">Total</td>
              <td class="text-right">₹ ${fmt(invoice.taxable_amount)}</td>
              <td class="text-right">₹ ${fmt(invoice.cgst_amount)}</td>
              <td class="text-right">₹ ${fmt(invoice.sgst_amount)}</td>
              <td class="text-right">₹ ${fmt(invoice.total_tax)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>
          <div class="terms-title">Terms & Conditions:</div>
          <ol class="terms-list">
            <li>Goods once sold will not be taken back except for manufacturing defects.</li>
            <li>Please check the expiry date before use.</li>
            <li>Keep medicines out of reach of children.</li>
          </ol>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-label">Authorized Signatory</div>
          <div style="font-size:7pt;color:#6b7280;margin-top:2px">${shop.business_name||''}</div>
        </div>
      </div>

      <div class="page-num">Page 1 of 2 | ${shop.business_name||''} | Generated ${new Date().toLocaleString('en-IN')}</div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// PAGE 2: CURELI PLATFORM INVOICE
// ════════════════════════════════════════════════════════════

function renderPage2({ order, invoice }) {
  const shopNetAmount  = Number(invoice.net_amount || 0);
  const serviceCharge  = Number(order.service_charge || 0);
  const deliveryFee    = Number(order.delivery_fee || 0);
  const kmSurcharge    = Number(order.km_surcharge || 0);
  const tip            = Number(order.tip || 0);
  const grandTotal     = Number(order.total_amount || 0);

  const deliveryAddr = order.delivery_address_snapshot;
  const addrText = deliveryAddr ? [
    deliveryAddr.address_line_1, deliveryAddr.city, deliveryAddr.state, deliveryAddr.pincode,
  ].filter(Boolean).join(', ') : '—';

  return `
    <div class="page-break"></div>
    <div class="page">
      <!-- Cureli Header -->
      <div class="cureli-header">
        <div class="cureli-name">${CURELI_COMPANY.name}</div>
        <div class="cureli-meta">${CURELI_COMPANY.address}</div>
        <div class="cureli-meta">Phone: ${CURELI_COMPANY.phone} | Email: ${CURELI_COMPANY.email}</div>
        
      </div>

      <!-- Reference -->
      <div class="details-grid">
        <div class="detail-box">
          <div class="detail-title">Order Details</div>
          <div class="detail-row"><span class="detail-label">Order No:</span><span class="detail-value-lg" style="color:#7c3aed">${order.order_number}</span></div>
          <div class="detail-row"><span class="detail-label">Shop Invoice:</span><span style="font-family:monospace">${invoice.invoice_number}</span></div>
          <div class="detail-row"><span class="detail-label">Order Date:</span><span>${fmtDate(order.placed_at)}</span></div>
          <div class="detail-row"><span class="detail-label">Payment:</span><span>${order.payment_method} <span class="paid-badge">PAID</span></span></div>
          ${order.razorpay_payment_id ? `<div class="detail-row"><span class="detail-label">Txn ID:</span><span style="font-family:monospace;font-size:8pt">${order.razorpay_payment_id}</span></div>` : ''}
        </div>
        <div class="detail-box">
          <div class="detail-title">Delivery Details</div>
          <div class="detail-row"><span class="detail-label">Customer:</span><span class="detail-value">${order.customer_name_snapshot}</span></div>
          <div class="detail-row"><span class="detail-label">Phone:</span><span>${order.customer_phone_snapshot}</span></div>
          <div class="detail-row"><span class="detail-label">Address:</span><span style="max-width:200px;text-align:right">${addrText}</span></div>
          ${Number(order.distance_km)>0 ? `<div class="detail-row"><span class="detail-label">Distance:</span><span>${Number(order.distance_km).toFixed(1)} km</span></div>` : ''}
        </div>
      </div>

      <!-- Charges Breakdown -->
      <h3 style="font-size:12pt;font-weight:bold;color:#05015A;margin:20px 0 12px">Charges Breakdown</h3>
      <table class="charges-table" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <tbody>
          <tr><td class="label">Medicine Total (see Page 1)</td><td class="value">₹ ${fmt(shopNetAmount)}</td></tr>
          ${serviceCharge > 0 ? `<tr><td class="label">Service Charge</td><td class="value">₹ ${fmt(serviceCharge)}</td></tr>` : ''}
          ${deliveryFee > 0 ? `<tr><td class="label">Delivery Fee</td><td class="value">₹ ${fmt(deliveryFee)}</td></tr>` : ''}
          ${kmSurcharge > 0 ? `<tr><td class="label">Distance Surcharge</td><td class="value">₹ ${fmt(kmSurcharge)}</td></tr>` : ''}
          ${tip > 0 ? `<tr><td class="label">Tip</td><td class="value">₹ ${fmt(tip)}</td></tr>` : ''}
          <tr class="grand"><td>Grand Total</td><td class="value">₹ ${fmt(grandTotal)}</td></tr>
        </tbody>
      </table>

      <!-- Amount in Words -->
      <div class="words-box" style="margin-bottom:20px">
        <div class="words-label">Total Amount in Words:</div>
        <div class="words-value">${numberToWords(grandTotal)}</div>
      </div>

      <!-- Note -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:20px">
        <h4 style="font-size:9pt;font-weight:bold;color:#374151;margin-bottom:8px">Important Information</h4>
        <ul style="font-size:8pt;color:#6b7280;padding-left:16px;line-height:1.8">
          <li>Page 1 contains the pharmacy tax invoice for medicines purchased.</li>
          <li>This page (Page 2) contains platform delivery and service charges by ${CURELI_COMPANY.name}.</li>
          <li>For medicine-related queries, contact the pharmacy directly.</li>
          <li>For delivery or platform issues, contact ${CURELI_COMPANY.email} or ${CURELI_COMPANY.phone}.</li>
        </ul>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>
          <div class="terms-title">Terms & Conditions:</div>
          <ol class="terms-list">
            <li>Delivery charges are non-refundable once order is dispatched.</li>
            <li>Medicines can only be returned as per pharmacy policy (see Page 1).</li>
            <li>For refunds, please contact Cureli support within 24 hours.</li>
          </ol>
        </div>
        <div class="sig-box">
          <div style="font-size:9pt;color:#666;margin-bottom:20px">This is a system-generated invoice.</div>
          <div class="sig-label">${CURELI_COMPANY.name}</div>
          <div style="font-size:7pt;color:#6b7280">${CURELI_COMPANY.website}</div>
        </div>
      </div>

      <div class="page-num">Page 2 of 2 | ${CURELI_COMPANY.name} | Order ${order.order_number}</div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// EXPORT — full HTML document
// ════════════════════════════════════════════════════════════

export function buildInvoiceHtml(data) {
  const page1 = renderPage1(data);
  const page2 = renderPage2(data);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>${CSS}</style></head>
<body>${page1}${page2}</body>
</html>`;
}