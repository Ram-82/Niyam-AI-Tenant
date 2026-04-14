import pdfParse from 'pdf-parse';

const GSTIN_REGEX = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/g;
const INVOICE_NUMBER_REGEX = /(?:proforma\s*invoice\s*(?:no|number|#)|invoice\s*(?:no|number|#)|bill\s*(?:no|number)|inv\s*(?:no|number|#)|voucher\s*no)[^\w]*([A-Z0-9\/\-]+)/gi;
const DATE_REGEX = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
// Matches "Taxable Amount", "Taxable Value", and abbreviated "Taxable Amt"
const AMOUNT_REGEX = /(?:taxable\s*(?:value|amount|amt)|base\s*amount)[^\d]*(\d[\d,]*\.?\d*)/gi;
// Matches "Grand Total", "Total Amount", "Invoice Total", etc.
const TOTAL_REGEX = /(?:grand\s*total|total\s*(?:amount|value|invoice\s*value)|invoice\s*(?:total|value))[^\d]*(\d[\d,]*\.?\d*)/gi;
// Handles "CGST 76.5", "CGST: 76.5", "CGST @ 9%\n76.5", "CGST @ 9% 76.5"
const CGST_REGEX = /cgst\s*(?:@\s*[\d.]+\s*%\s*)?[:\-]?\s*(\d[\d,]*\.?\d*)/gi;
const SGST_REGEX = /sgst\s*(?:@\s*[\d.]+\s*%\s*)?[:\-]?\s*(\d[\d,]*\.?\d*)/gi;
const IGST_REGEX = /igst\s*(?:@\s*[\d.]+\s*%\s*)?[:\-]?\s*(\d[\d,]*\.?\d*)/gi;

function parseAmount(str) {
  if (!str) return null;
  const cleaned = str.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractFirst(text, regex) {
  const match = regex.exec(text);
  regex.lastIndex = 0;
  return match ? match[1]?.trim() : null;
}

function extractAll(text, regex) {
  const results = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push(match[1]?.trim());
  }
  regex.lastIndex = 0;
  return results;
}

function parseDate(text) {
  const matches = [];
  let match;
  while ((match = DATE_REGEX.exec(text)) !== null) {
    matches.push(`${match[1]}/${match[2]}/${match[3]}`);
  }
  DATE_REGEX.lastIndex = 0;
  return matches[0] || null;
}

/**
 * Multi-strategy HSN/SAC code extraction.
 *
 * The original single-regex approach failed on table-format invoices because
 * [^\d]* halts at any digit in product descriptions (e.g. "Dlink 8 Port Switch")
 * before reaching the actual HSN code further in the text.
 *
 * Strategy 1 – inline: keyword immediately followed by the code on the same token
 *   (e.g. "HSN: 85176290", "HSN/SAC 998361")
 * Strategy 2 – table column: HSN/SAC is a column header; scan the next 500 chars
 *   for the first standalone 8-, 6-, or 4-digit number (longer codes preferred).
 */
function extractHsnCode(text) {
  const upperText = text.toUpperCase();

  // Strategy 1: keyword directly followed by code (same line / same token)
  const inlineMatch = upperText.match(
    /(?:HSN(?:\/SAC)?|SAC)\s*(?:CODE)?\s*[:\-]?\s*(\d{4,8})(?!\d)/
  );
  if (inlineMatch) return inlineMatch[1];

  // Strategy 2: keyword as table header, code appears within the next 500 chars
  const hsnKeywordIdx = upperText.search(/\bHSN(?:\/SAC)?\b|\bSAC\b/);
  if (hsnKeywordIdx !== -1) {
    const windowEnd = Math.min(hsnKeywordIdx + 500, upperText.length);
    // Normalise dotted notation like 8517.62.90 → 85176290 before searching
    const searchWindow = upperText
      .substring(hsnKeywordIdx, windowEnd)
      .replace(/(\d)\.(\d)/g, '$1$2');

    // Prefer longer codes: 8-digit (goods HSN) → 6-digit (SAC/chapter) → 4-digit
    for (const length of [8, 6, 4]) {
      const pattern = new RegExp(`(?<!\\d)(\\d{${length}})(?!\\d)`);
      const numMatch = searchWindow.match(pattern);
      if (numMatch) return numMatch[1];
    }
  }

  return null;
}

export async function parsePdf(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text;
  const upperText = text.toUpperCase();

  const gstins = [...new Set(upperText.match(GSTIN_REGEX) || [])];
  const sellerGstin = gstins[0] || null;
  const buyerGstin = gstins[1] || null;

  const invoiceNumber = extractFirst(text, INVOICE_NUMBER_REGEX);
  const invoiceDate = parseDate(text);
  const hsnCode = extractHsnCode(text);
  const taxableAmount = parseAmount(extractFirst(text, AMOUNT_REGEX));
  const cgst = parseAmount(extractFirst(text, CGST_REGEX));
  const sgst = parseAmount(extractFirst(text, SGST_REGEX));
  const igst = parseAmount(extractFirst(text, IGST_REGEX));
  const total = parseAmount(extractFirst(text, TOTAL_REGEX));

  // Extract names near keyword positions (simple heuristic)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let sellerName = null;
  let buyerName = null;
  for (let i = 0; i < lines.length; i++) {
    if (/seller|from|supplier|vendor/i.test(lines[i]) && lines[i + 1]) {
      sellerName = lines[i + 1];
    }
    if (/buyer|to|recipient|customer/i.test(lines[i]) && lines[i + 1]) {
      buyerName = lines[i + 1];
    }
  }

  return {
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    seller_gstin: sellerGstin,
    buyer_gstin: buyerGstin,
    seller_name: sellerName,
    buyer_name: buyerName,
    hsn_code: hsnCode,
    taxable_amount: taxableAmount,
    cgst: cgst,
    sgst: sgst,
    igst: igst,
    total_amount: total,
    raw_extracted: { text: text.substring(0, 5000), gstins },
  };
}
