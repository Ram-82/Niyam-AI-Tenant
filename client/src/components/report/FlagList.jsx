import React, { useState } from 'react';
import FlagCard from './FlagCard.jsx';
import Badge from '../ui/Badge.jsx';

export default function FlagList({ flags }) {
  const [tab, setTab] = useState('all');
  const critical = flags.filter(f => f.severity === 'critical');
  const warnings = flags.filter(f => f.severity === 'warning');

  const displayed = tab === 'critical' ? critical : tab === 'warning' ? warnings : flags;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'all', label: 'All', count: flags.length },
          { key: 'critical', label: 'Critical', count: critical.length },
          { key: 'warning', label: 'Warnings', count: warnings.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-primary'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20' : 'bg-border'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-8 text-muted text-sm">No {tab === 'all' ? '' : tab} issues found.</div>
      ) : (
        <div className="space-y-3">
          {displayed.map(flag => <FlagCard key={flag.id} flag={flag} />)}
        </div>
      )}
    </div>
  );
}
