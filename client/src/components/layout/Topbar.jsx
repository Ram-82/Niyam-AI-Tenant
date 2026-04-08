import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export default function Topbar({ onMenuClick }) {
  const { ca } = useAuth();
  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <button
        className="md:hidden p-2 rounded-lg hover:bg-surface"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold text-primary">{ca?.full_name}</div>
          <div className="text-xs text-muted">{ca?.email}</div>
        </div>
        <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
          {ca?.full_name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
