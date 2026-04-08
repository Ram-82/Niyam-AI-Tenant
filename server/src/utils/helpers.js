import crypto from 'crypto';

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = typeof value === 'string' ? sanitizeString(value) : value;
  }
  return sanitized;
}

export function calculateComplianceScore(criticalCount, warningCount) {
  let score = 100;
  score -= criticalCount * 10;
  score -= warningCount * 3;
  return Math.max(0, Math.round(score));
}

export function getScoreBand(score) {
  if (score >= 90) return { label: 'Ready to File', color: 'success' };
  if (score >= 70) return { label: 'Minor Issues', color: 'warning' };
  if (score >= 50) return { label: 'Needs Attention', color: 'orange' };
  return { label: 'Not Ready', color: 'danger' };
}

export function formatMonth(monthStr) {
  // "2025-06" → "June 2025"
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
