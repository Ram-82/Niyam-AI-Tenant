import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, User, LogOut, Zap, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { cn } from '../../lib/utils.js';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: Users, label: 'Clients', hide: true }, // handled in dashboard
  { to: '/profile', icon: FileText, label: 'Reports', hide: true },
  { to: '/profile', icon: User, label: 'Profile' },
];

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar({ mobile, onClose }) {
  const { ca, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className={cn(
      'flex flex-col bg-primary text-white',
      mobile ? 'w-full h-full' : 'w-64 min-h-screen fixed left-0 top-0 z-40'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight">Niyam AI</div>
            <div className="text-xs text-white/50 leading-tight">CA Tool</div>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        )}
      </div>

      {/* CA Info */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="text-xs text-white/50 uppercase tracking-wide mb-1">Signed in as</div>
        <div className="font-semibold text-sm truncate">{ca?.full_name}</div>
        {ca?.firm_name && <div className="text-xs text-white/60 truncate">{ca.firm_name}</div>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to + label}
            to={to}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
