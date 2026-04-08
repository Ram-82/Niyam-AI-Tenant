import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function Modal({ isOpen, onClose, title, children, className }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-lg shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto', className)}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
