import * as XLSX from 'xlsx';

const COLUMN_MAP = {
  invoice_number: ['invoice no', 'invoice number', 'bill number', 'bill no', 'voucher no', 'inv no', 'inv #', 'invoice #'],
  invoice_date: ['date', 'invoice date', 'bill date', 'txn date', 'transaction date'],
  seller_gstin: ['gstin', 'supplier gstin', 'seller gstin', 'from gstin', 'party gstin', 'vendor gstin'],
  buyer_gstin: ['buyer gstin', 'recipient gstin', 'customer gstin', 'to gstin'],
  seller_name: ['seller name', 'supplier name', 'vendor name', 'from', 'party name'],
  buyer_name: ['buyer name', 'recipient name', 'customer name', 'to', 'client name'],
  hsn_code: ['hsn', 'hsn code', 'sac', 'sac code', 'hsn/sac'],
  taxable_amount: ['taxable value', 'taxable amount', 'base amount', 'assessable value', 'taxable'],
  cgst: ['cgst', 'cgst amount', 'central tax'],
  sgst: ['sgst', 'sgst amount', 'state tax'],
  igst: ['igst', 'igst amount', 'integrated tax'],
  total_amount: ['total', 'invoice value', 'amount', 'total amount', 'net amount', 'invoice total'],
};

function findColumnKey(header) {
  const normalized = header.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}

function parseAmount(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(val);
    if (date) return `${date.d}/${date.m}/${date.y}`;
  }
  return String(val).trim();
}

export function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows.length) return [];

  // Find header row (first row with recognizable column names)
  let headerRowIndex = 0;
  let headerMap = {};

  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    const mapped = {};
    for (let j = 0; j < row.length; j++) {
      const key = findColumnKey(String(row[j]));
      if (key) mapped[key] = j;
    }
    if (Object.keys(mapped).length >= 2) {
      headerRowIndex = i;
      headerMap = mapped;
      break;
    }
  }

  const invoices = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(cell => cell === '' || cell === null)) continue;

    const get = (field) => headerMap[field] !== undefined ? row[headerMap[field]] : null;

    invoices.push({
      invoice_number: get('invoice_number') ? String(get('invoice_number')).trim() : null,
      invoice_date: parseDate(get('invoice_date')),
      seller_gstin: get('seller_gstin') ? String(get('seller_gstin')).toUpperCase().trim() : null,
      buyer_gstin: get('buyer_gstin') ? String(get('buyer_gstin')).toUpperCase().trim() : null,
      seller_name: get('seller_name') ? String(get('seller_name')).trim() : null,
      buyer_name: get('buyer_name') ? String(get('buyer_name')).trim() : null,
      hsn_code: get('hsn_code') ? String(get('hsn_code')).trim() : null,
      taxable_amount: parseAmount(get('taxable_amount')),
      cgst: parseAmount(get('cgst')),
      sgst: parseAmount(get('sgst')),
      igst: parseAmount(get('igst')),
      total_amount: parseAmount(get('total_amount')),
      raw_extracted: { row_index: i, raw_row: row },
    });
  }

  return invoices;
}
