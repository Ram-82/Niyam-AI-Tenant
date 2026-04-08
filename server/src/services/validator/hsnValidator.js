export function validateHsn(invoice) {
  const flags = [];
  const invNum = invoice.invoice_number || 'Unknown';

  // Rule 4: HSN_MISSING
  if (!invoice.hsn_code) {
    flags.push({
      flag_type: 'HSN_MISSING',
      severity: 'critical',
      field_name: 'hsn_code',
      expected_value: '4, 6, or 8 digit HSN/SAC code',
      actual_value: null,
      message: `HSN/SAC code is missing on invoice ${invNum}`,
    });
    return flags;
  }

  // Rule 5: HSN_INVALID_LENGTH
  const digits = invoice.hsn_code.replace(/\D/g, '');
  if (![4, 6, 8].includes(digits.length)) {
    flags.push({
      flag_type: 'HSN_INVALID_LENGTH',
      severity: 'warning',
      field_name: 'hsn_code',
      expected_value: '4, 6, or 8 digits',
      actual_value: invoice.hsn_code,
      message: `HSN code '${invoice.hsn_code}' should be 4, 6, or 8 digits on invoice ${invNum}`,
    });
  }

  return flags;
}
