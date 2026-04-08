import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import api from '../lib/axios.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import ClientForm from '../components/clients/ClientForm.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { formatMonth, formatDate, getScoreBand } from '../lib/utils.js';
import toast from 'react-hot-toast';

const statusBadge = {
  completed: <Badge variant="success">Completed</Badge>,
  processing: <Badge variant="info">Processing</Badge>,
  pending: <Badge variant="muted">Pending</Badge>,
  failed: <Badge variant="critical">Failed</Badge>,
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [monthPicker, setMonthPicker] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const { data } = await api.get(`/clients/${id}`);
      setClient(data);
    } catch {
      toast.error('Client not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates) => {
    setEditLoading(true);
    try {
      const { data } = await api.put(`/clients/${id}`, updates);
      setClient(prev => ({ ...prev, ...data }));
      setShowEdit(false);
      toast.success('Client updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${client.name}? This will remove all sessions and reports.`)) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleNewSession = async () => {
    if (!monthPicker) {
      toast.error('Please select a month');
      return;
    }
    setCreatingSession(true);
    try {
      const { data } = await api.post('/sessions', { client_id: id, month: monthPicker });
      navigate(`/sessions/${data.id}/upload`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    } finally {
      setCreatingSession(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!client) return null;

  const sessions = client.upload_sessions || [];
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div>
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted hover:text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Client header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
              <Building2 size={28} className="text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                {client.gstin && <span className="text-sm font-mono text-muted">GSTIN: {client.gstin}</span>}
                {client.pan && <span className="text-sm font-mono text-muted">PAN: {client.pan}</span>}
                {client.business_type && <Badge variant="muted">{client.business_type}</Badge>}
              </div>
              {client.email && <div className="text-sm text-muted mt-1">{client.email} {client.phone && `· ${client.phone}`}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Edit size={14} /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 size={14} className="text-danger" />
            </Button>
          </div>
        </div>
      </div>

      {/* New session */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold text-primary mb-3">Start New Session</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="month"
            className="input w-48"
            value={monthPicker}
            onChange={e => setMonthPicker(e.target.value)}
          />
          <Button onClick={handleNewSession} loading={creatingSession}>
            <Plus size={16} />
            Create Session
          </Button>
        </div>
      </div>

      {/* Session history */}
      <div className="card">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold text-primary">Session History</h2>
        </div>
        {sortedSessions.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">No sessions yet. Create one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Period', 'Status', 'Files', 'Invoices', 'Issues', 'Score', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-muted font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSessions.map(s => {
                  const report = s.reports?.[0];
                  const band = report ? getScoreBand(report.compliance_score) : null;
                  return (
                    <tr key={s.id} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="py-3 px-4 font-medium">{formatMonth(s.month)}</td>
                      <td className="py-3 px-4">{statusBadge[s.status]}</td>
                      <td className="py-3 px-4 text-muted">{s.file_count || 0}</td>
                      <td className="py-3 px-4 text-muted">{report?.total_invoices ?? '—'}</td>
                      <td className="py-3 px-4">
                        {report ? (
                          <span className={report.total_flags > 0 ? 'text-danger font-semibold' : 'text-success'}>
                            {report.total_flags}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {report ? (
                          <Badge variant={band?.color === 'success' ? 'success' : band?.color === 'warning' ? 'warning' : 'critical'}>
                            {report.compliance_score}/100
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {s.status === 'completed' && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/sessions/${s.id}/results`)}>
                              View
                            </Button>
                          )}
                          {(s.status === 'pending' || s.status === 'processing') && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/sessions/${s.id}/upload`)}>
                              {s.status === 'pending' ? 'Upload' : 'Status'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Client">
        <ClientForm initialData={client} onSubmit={handleUpdate} loading={editLoading} />
      </Modal>
    </div>
  );
}
