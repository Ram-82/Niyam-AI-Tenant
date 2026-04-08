export function formatMonth(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatAmount(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export function getScoreBand(score) {
  if (score >= 90) return { label: 'Ready to File', color: 'success', bg: 'bg-green-100', text: 'text-success' };
  if (score >= 70) return { label: 'Minor Issues', color: 'warning', bg: 'bg-yellow-100', text: 'text-warning' };
  if (score >= 50) return { label: 'Needs Attention', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-600' };
  return { label: 'Not Ready', color: 'danger', bg: 'bg-red-100', text: 'text-danger' };
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function generateUsername(fullName) {
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(Boolean)
    .join('_')
    .substring(0, 20);
}
