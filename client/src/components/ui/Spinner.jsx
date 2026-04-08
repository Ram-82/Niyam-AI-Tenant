import React from 'react';
import { cn } from '../../lib/utils.js';

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-border border-t-accent',
        sizes[size],
        className
      )}
    />
  );
}
