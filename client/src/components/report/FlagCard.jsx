import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import Badge from '../ui/Badge.jsx';

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    border: 'border-l-danger',
    bg: 'bg-red-50',
    iconColor: 'text-danger',
    badge: 'critical',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-l-warning',
    bg: 'bg-yellow-50',
    iconColor: 'text-warning',
    badge: 'warning',
  },
  info: {
    icon: Info,
    border: 'border-l-blue-400',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    badge: 'info',
  },
};

export default function FlagCard({ flag }) {
  const config = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg border-l-4 p-4', config.border, config.bg)}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={cn('mt-0.5 flex-shrink-0', config.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant={config.badge}>{flag.severity.toUpperCase()}</Badge>
            <span className="text-xs font-mono text-muted">{flag.flag_type}</span>
            {flag.extracted_invoices?.invoice_number && (
              <span className="text-xs text-muted">· Invoice #{flag.extracted_invoices.invoice_number}</span>
            )}
          </div>
          <p className="text-sm text-primary">{flag.message}</p>
          {(flag.field_name || flag.actual_value) && (
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted">
              {flag.field_name && <span>Field: <span className="font-mono text-primary">{flag.field_name}</span></span>}
              {flag.actual_value && <span>Found: <span className="font-mono text-primary">{flag.actual_value}</span></span>}
              {flag.expected_value && <span>Expected: <span className="font-mono text-primary">{flag.expected_value}</span></span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
