const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function validateGstin(invoice) {
  const flags = [];
  const invNum = invoice.invoice_number || 'Unknown';

  // Rule 1: GSTIN_MISSING
  if (!invoice.seller_gstin) {
    flags.push({
      flag_type: 'GSTIN_MISSING',
      severity: 'critical',
      field_name: 'seller_gstin',
      expected_value: 'Valid 15-char GSTIN',
      actual_value: null,
      message: `Seller GSTIN is missing on invoice ${invNum}`,
    });
  } else if (!GSTIN_REGEX.test(invoice.seller_gstin)) {
    // Rule 2: GSTIN_FORMAT_INVALID
    flags.push({
      flag_type: 'GSTIN_FORMAT_INVALID',
      severity: 'critical',
      field_name: 'seller_gstin',
      expected_value: 'Valid 15-char GSTIN format',
      actual_value: invoice.seller_gstin,
      message: `GSTIN '${invoice.seller_gstin}' on invoice ${invNum} is not a valid format`,
    });
  }

  if (!invoice.buyer_gstin) {
    flags.push({
      flag_type: 'GSTIN_MISSING',
      severity: 'critical',
      field_name: 'buyer_gstin',
      expected_value: 'Valid 15-char GSTIN',
      actual_value: null,
      message: `Buyer GSTIN is missing on invoice ${invNum}`,
    });
  } else if (!GSTIN_REGEX.test(invoice.buyer_gstin)) {
    flags.push({
      flag_type: 'GSTIN_FORMAT_INVALID',
      severity: 'critical',
      field_name: 'buyer_gstin',
      expected_value: 'Valid 15-char GSTIN format',
      actual_value: invoice.buyer_gstin,
      message: `Buyer GSTIN '${invoice.buyer_gstin}' on invoice ${invNum} is not a valid format`,
    });
  }

  // Rule 3: GSTIN_STATE_MISMATCH (basic check — state codes 01-37)
  if (invoice.seller_gstin && GSTIN_REGEX.test(invoice.seller_gstin)) {
    const stateCode = parseInt(invoice.seller_gstin.substring(0, 2));
    if (stateCode < 1 || stateCode > 37) {
      flags.push({
        flag_type: 'GSTIN_STATE_MISMATCH',
        severity: 'warning',
        field_name: 'seller_gstin',
        expected_value: 'State code 01-37',
        actual_value: invoice.seller_gstin.substring(0, 2),
        message: `State code in GSTIN may not match registered state on invoice ${invNum}`,
      });
    }
  }

  return flags;
}
