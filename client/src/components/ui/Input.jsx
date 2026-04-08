import React from 'react';
import { cn } from '../../lib/utils.js';

export default function Input({ label, error, className, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className={cn('input', error && 'border-danger focus:ring-danger', className)} {...props} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea
        className={cn('input resize-none', error && 'border-danger focus:ring-danger', className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={cn('input', error && 'border-danger focus:ring-danger', className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
