import { validateGstin } from './gstinValidator.js';
import { validateHsn } from './hsnValidator.js';
import { validateInvoice } from './invoiceValidator.js';

export function runValidators(invoices) {
  const allFlags = [];

  for (const invoice of invoices) {
    const gstinFlags = validateGstin(invoice);
    const hsnFlags = validateHsn(invoice);
    const invoiceFlags = validateInvoice(invoice, invoices);

    const invoiceId = invoice._tempId;

    for (const flag of [...gstinFlags, ...hsnFlags, ...invoiceFlags]) {
      allFlags.push({ ...flag, invoiceId });
    }
  }

  return allFlags;
}
