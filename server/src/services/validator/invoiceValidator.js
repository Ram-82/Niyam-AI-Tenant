export function validateInvoice(invoice, allInvoices) {
  const flags = [];
  const invNum = invoice.invoice_number || 'Unknown';

  // Rule 6: INVOICE_NUMBER_MISSING
  if (!invoice.invoice_number) {
    flags.push({
      flag_type: 'INVOICE_NUMBER_MISSING',
      severity: 'critical',
      field_name: 'invoice_number',
      expected_value: 'Invoice number',
      actual_value: null,
      message: 'Invoice number is missing',
    });
  }

  // Rule 7: INVOICE_DATE_MISSING
  if (!invoice.invoice_date) {
    flags.push({
      flag_type: 'INVOICE_DATE_MISSING',
      severity: 'critical',
      field_name: 'invoice_date',
      expected_value: 'Invoice date',
      actual_value: null,
      message: `Invoice date is missing on invoice ${invNum}`,
    });
  } else {
    // Rule 8: INVOICE_DATE_FUTURE
    const dateParts = invoice.invoice_date.split(/[\/\-\.]/);
    let invoiceDate;
    if (dateParts.length === 3) {
      // Try DD/MM/YYYY
      const [d, m, y] = dateParts;
      const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
      invoiceDate = new Date(year, parseInt(m) - 1, parseInt(d));
    }
    if (invoiceDate && !isNaN(invoiceDate.getTime()) && invoiceDate > new Date()) {
      flags.push({
        flag_type: 'INVOICE_DATE_FUTURE',
        severity: 'warning',
        field_name: 'invoice_date',
        expected_value: 'Past or current date',
        actual_value: invoice.invoice_date,
        message: `Invoice date ${invoice.invoice_date} is a future date — verify correctness`,
      });
    }
  }

  // Rule 9: AMOUNT_ZERO_OR_NEGATIVE
  if (invoice.taxable_amount !== null && invoice.taxable_amount <= 0) {
    flags.push({
      flag_type: 'AMOUNT_ZERO_OR_NEGATIVE',
      severity: 'critical',
      field_name: 'taxable_amount',
      expected_value: 'Positive amount',
      actual_value: String(invoice.taxable_amount),
      message: `Taxable amount is zero or negative on invoice ${invNum}`,
    });
  }

  // Rule 10: TAX_AMOUNT_MISMATCH
  if (
    invoice.taxable_amount != null &&
    invoice.total_amount != null &&
    (invoice.cgst != null || invoice.sgst != null || invoice.igst != null)
  ) {
    const cgst = invoice.cgst || 0;
    const sgst = invoice.sgst || 0;
    const igst = invoice.igst || 0;
    const taxTotal = invoice.taxable_amount + cgst + sgst + igst;
    const diff = Math.abs(taxTotal - invoice.total_amount);
    if (diff > 1) {
      flags.push({
        flag_type: 'TAX_AMOUNT_MISMATCH',
        severity: 'warning',
        field_name: 'total_amount',
        expected_value: String(taxTotal.toFixed(2)),
        actual_value: String(invoice.total_amount),
        message: `Tax amounts don't add up to total on invoice ${invNum}. Expected ${taxTotal.toFixed(2)}, got ${invoice.total_amount}`,
      });
    }
  }

  // Rule 11: DUPLICATE_INVOICE_NUMBER
  if (invoice.invoice_number) {
    const count = allInvoices.filter(
      (inv) => inv.invoice_number === invoice.invoice_number
    ).length;
    if (count > 1) {
      // Only flag once (on first occurrence)
      const firstIndex = allInvoices.findIndex(
        (inv) => inv.invoice_number === invoice.invoice_number
      );
      if (allInvoices[firstIndex] === invoice) {
        flags.push({
          flag_type: 'DUPLICATE_INVOICE_NUMBER',
          severity: 'critical',
          field_name: 'invoice_number',
          expected_value: 'Unique invoice number',
          actual_value: invoice.invoice_number,
          message: `Invoice number ${invoice.invoice_number} appears ${count} times in uploaded documents`,
        });
      }
    }
  }

  // Rule 12: BOTH_CGST_IGST_PRESENT
  if (invoice.cgst > 0 && invoice.sgst > 0 && invoice.igst > 0) {
    flags.push({
      flag_type: 'BOTH_CGST_IGST_PRESENT',
      severity: 'critical',
      field_name: 'cgst/igst',
      expected_value: 'Either CGST+SGST or IGST',
      actual_value: `CGST=${invoice.cgst}, SGST=${invoice.sgst}, IGST=${invoice.igst}`,
      message: `Invoice ${invNum} has both CGST/SGST and IGST — only one should apply`,
    });
  }

  return flags;
}
