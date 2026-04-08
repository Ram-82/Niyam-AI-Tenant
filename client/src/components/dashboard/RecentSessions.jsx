import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMonth, formatDate, getScoreBand } from '../../lib/utils.js';
import Badge from '../ui/Badge.jsx';

const statusBadge = {
  completed: <Badge variant="success">Completed</Badge>,
  processing: <Badge variant="info">Processing</Badge>,
  pending: <Badge variant="muted">Pending</Badge>,
  failed: <Badge variant="critical">Failed</Badge>,
};

export default function RecentSessions({ sessions }) {
  const navigate = useNavigate();
  if (!sessions?.length) return (
    <div className="text-center py-8 text-muted text-sm">No recent sessions yet.</div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-2 text-xs text-muted font-semibold uppercase tracking-wide">Client</th>
            <th className="text-left py-3 px-2 text-xs text-muted font-semibold uppercase tracking-wide">Period</th>
            <th className="text-left py-3 px-2 text-xs text-muted font-semibold uppercase tracking-wide">Status</th>
            <th className="text-left py-3 px-2 text-xs text-muted font-semibold uppercase tracking-wide">Files</th>
            <th className="text-left py-3 px-2 text-xs text-muted font-semibold uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr
              key={s.id}
              className="border-b border-border hover:bg-surface cursor-pointer transition-colors"
              onClick={() => s.status === 'completed' ? navigate(`/sessions/${s.id}/results`) : navigate(`/sessions/${s.id}/upload`)}
            >
              <td className="py-3 px-2 font-medium">{s.clients?.name || '—'}</td>
              <td className="py-3 px-2 text-muted">{formatMonth(s.month)}</td>
              <td className="py-3 px-2">{statusBadge[s.status] || <Badge variant="muted">{s.status}</Badge>}</td>
              <td className="py-3 px-2 text-muted">{s.file_count || 0}</td>
              <td className="py-3 px-2 text-muted">{formatDate(s.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
