import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, FileText } from 'lucide-react';
import { formatDate, getScoreBand } from '../../lib/utils.js';
import Badge from '../ui/Badge.jsx';

export default function ClientCard({ client }) {
  const navigate = useNavigate();
  return (
    <div
      className="card p-5 cursor-pointer hover:shadow-md hover:border-accent/30 transition-all duration-150 group"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-accent" />
          </div>
          <div>
            <div className="font-bold text-primary group-hover:text-accent transition-colors">{client.name}</div>
            {client.gstin && (
              <div className="text-xs font-mono text-muted mt-0.5">{client.gstin}</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <FileText size={12} />
          <span>{client.session_count || 0} session{client.session_count !== 1 ? 's' : ''}</span>
        </div>
        {client.last_session_date && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span>Last: {formatDate(client.last_session_date)}</span>
          </div>
        )}
        {client.business_type && (
          <Badge variant="muted">{client.business_type}</Badge>
        )}
      </div>
    </div>
  );
}
