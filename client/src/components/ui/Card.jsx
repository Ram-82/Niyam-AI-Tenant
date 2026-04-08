import React from 'react';
import { cn } from '../../lib/utils.js';

export default function Card({ children, className, ...props }) {
  return (
    <div className={cn('card p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h3 className={cn('text-lg font-bold text-primary', className)}>{children}</h3>;
}
