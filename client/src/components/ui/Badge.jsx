import React from 'react';
import { cn } from '../../lib/utils.js';

export default function Badge({ children, variant = 'muted', className }) {
  const variants = {
    critical: 'badge-critical',
    warning: 'badge-warning',
    success: 'badge-success',
    info: 'badge-info',
    muted: 'badge-muted',
    accent: 'badge bg-orange-100 text-accent',
  };
  return (
    <span className={cn(variants[variant] || variants.muted, className)}>
      {children}
    </span>
  );
}
