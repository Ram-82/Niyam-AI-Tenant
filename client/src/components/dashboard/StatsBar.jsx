import React from 'react';
import { Users, FolderOpen, FileText, AlertTriangle } from 'lucide-react';

export default function StatsBar({ stats }) {
  const items = [
    { label: 'Total Clients', value: stats.totalClients, icon: Users, color: 'text-accent', bg: 'bg-orange-50' },
    { label: 'Sessions This Month', value: stats.sessionsThisMonth, icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Reports Generated', value: stats.reportsGenerated, icon: FileText, color: 'text-success', bg: 'bg-green-50' },
    { label: 'Issues This Month', value: stats.issuesThisMonth, icon: AlertTriangle, color: 'text-danger', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="card p-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{value ?? '—'}</div>
              <div className="text-xs text-muted">{label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
