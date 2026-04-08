import { parsePdf } from './pdfParser.js';
import { parseExcel } from './excelParser.js';

export async function parseFile(buffer, fileType) {
  switch (fileType) {
    case 'pdf':
      return [await parsePdf(buffer)];
    case 'xlsx':
    case 'xls':
    case 'csv':
      return parseExcel(buffer);
    default:
      return [];
  }
}

export function detectFileType(mimetype, originalname) {
  const ext = originalname.split('.').pop().toLowerCase();
  if (mimetype === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls'].includes(ext) || mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'xlsx';
  if (ext === 'csv' || mimetype === 'text/csv') return 'csv';
  if (['jpg', 'jpeg', 'png'].includes(ext) || mimetype.startsWith('image/')) return 'image';
  return null;
}
