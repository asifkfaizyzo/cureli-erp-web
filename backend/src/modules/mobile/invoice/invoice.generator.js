// backend/src/modules/mobile/invoice/invoice.generator.js (do not remove this comment)
// backend/src/modules/mobile/invoice/invoice.generator.js

import puppeteer from 'puppeteer';

let _browser = null;

async function getBrowser() {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  return _browser;
}

/**
 * Render an HTML string into a PDF buffer.
 * Reuses a single browser instance across calls.
 *
 * @param {string} html - Full HTML document
 * @returns {Promise<Buffer>}
 */
export async function htmlToPdf(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (_browser) await _browser.close();
});
process.on('SIGINT', async () => {
  if (_browser) await _browser.close();
});