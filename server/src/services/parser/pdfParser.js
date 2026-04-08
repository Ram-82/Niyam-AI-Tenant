import pdfParse from 'pdf-parse';

const GSTIN_REGEX = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/g;
const HSN_REGEX = /(?:HSN|SAC)[^\d]*(\d{4,8})/gi;
const INVOICE_NUMBER_REGEX = /(?:invoice\s*(?:no|number|#)|bill\s*(?:no|number)|inv\s*(?:no|number|#)|voucher\s*no)[^\w]*([A-Z0-9\/\-]+)/gi;
const DATE_REGEX = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
const AMOUNT_REGEX = /(?:taxable\s*(?:value|amount)|base\s*amount)[^\d]*(\d[\d,]*\.?\d*)/gi;
const TOTAL_REGEX = /(?:total\s*(?:amount|value|invoice\s*value)|invoice\s*(?:total|value))[^\d]*(\d[\d,]*\.?\d*)/gi;
const CGST_REGEX = /cgst[^\d]*(\d[\d,]*\.?\d*)/gi;
const SGST_REGEX = /sgst[^\d]*(\d[\d,]*\.?\d*)/gi;
const IGST_REGEX = /igst[^\d]*(\d[\d,]*\.?\d*)/gi;

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

export async function parsePdf(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text;
  const upperText = text.toUpperCase();

  const gstins = [...new Set(upperText.match(GSTIN_REGEX) || [])];
  const sellerGstin = gstins[0] || null;
  const buyerGstin = gstins[1] || null;

  const invoiceNumber = extractFirst(text, INVOICE_NUMBER_REGEX);
  const invoiceDate = parseDate(text);
  const hsnCode = extractFirst(upperText, HSN_REGEX);
  const taxableAmount = parseAmount(extractFirst(text, AMOUNT_REGEX));
  const cgst = parseAmount(extractFirst(text, CGST_REGEX));
  const sgst = parseAmount(extractFirst(text, SGST_REGEX));
  const igst = parseAmount(extractFirst(text, IGST_REGEX));
  const total = parseAmount(extractFirst(text, TOTAL_REGEX));

  // Extract names near GSTIN positions (simple heuristic)
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
