import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/axios.js';
import ScoreBadge from '../components/report/ScoreBadge.jsx';
import FlagList from '../components/report/FlagList.jsx';
import ReportDownload from '../components/report/ReportDownload.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { formatMonth, formatAmount } from '../lib/utils.js';
import toast from 'react-hot-toast';

export default function SessionResult() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const { data: results } = await api.get(`/sessions/${sessionId}/results`);
      setData(results);
    } catch {
      toast.error('Results not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return null;

  const { session, invoices, flags, report } = data;
  const score = report?.compliance_score ?? 0;
  const critical = flags.filter(f => f.severity === 'critical');
  const warnings = flags.filter(f => f.severity === 'warning');

  return (
    <div>
      <button onClick={() => navigate(`/clients/${session.client_id}`)} className="flex items-center gap-2 text-muted hover:text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Client
      </button>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <ScoreBadge score={score} />
            <div>
              <div className="text-xs text-muted uppercase tracking-wide mb-1">Validation Report</div>
              <h1 className="text-2xl font-bold text-primary">{session.clients?.name}</h1>
              <p className="text-muted text-sm">{formatMonth(session.month)}</p>
              {session.clients?.gstin && (
                <p className="text-sm font-mono text-muted mt-1">GSTIN: {session.clients.gstin}</p>
              )}
            </div>
          </div>
          {report && <ReportDownload report={report} sessionId={sessionId} />}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Invoices Processed', value: invoices.length, color: 'text-primary' },
          { label: 'Total Issues', value: flags.length, color: flags.length > 0 ? 'text-warning' : 'text-success' },
          { label: 'Critical', value: critical.length, color: critical.length > 0 ? 'text-danger' : 'text-success' },
          { label: 'Warnings', value: warnings.length, color: warnings.length > 0 ? 'text-warning' : 'text-success' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`text-3xl font-bold mb-1 ${color}`}>{value}</div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Flags */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="font-bold text-primary mb-4">
              Validation Issues
              {flags.length > 0 && <span className="ml-2 text-sm text-muted font-normal">({flags.length} found)</span>}
            </h2>
            {flags.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-success font-semibold text-lg mb-1">All Clear!</div>
                <div className="text-muted text-sm">No issues found. Ready to file.</div>
              </div>
            ) : (
              <FlagList flags={flags} />
            )}
          </div>
        </div>

        {/* Invoice table */}
        <div className="lg:col-span-3">
          <div className="card p-5">
            <h2 className="font-bold text-primary mb-4">Extracted Invoices</h2>
            {invoices.length === 0 ? (
              <div className="text-center py-6 text-muted text-sm">No invoices extracted.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted uppercase tracking-wide">
                      {['Invoice #', 'Date', 'Seller GSTIN', 'HSN', 'Taxable', 'Total'].map(h => (
                        <th key={h} className="text-left py-2 px-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const invFlags = flags.filter(f => f.invoice_id === inv.id);
                      const hasCritical = invFlags.some(f => f.severity === 'critical');
                      const hasWarning = invFlags.some(f => f.severity === 'warning');
                      return (
                        <tr key={inv.id} className={`border-b border-border text-xs ${hasCritical ? 'bg-red-50' : hasWarning ? 'bg-yellow-50' : ''}`}>
                          <td className="py-2 px-2 font-mono font-medium">
                            <div className="flex items-center gap-1.5">
                              {hasCritical && <span className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />}
                              {hasWarning && !hasCritical && <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />}
                              {inv.invoice_number || '—'}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-muted">{inv.invoice_date || '—'}</td>
                          <td className="py-2 px-2 font-mono text-muted">{inv.seller_gstin || '—'}</td>
                          <td className="py-2 px-2 font-mono text-muted">{inv.hsn_code || '—'}</td>
                          <td className="py-2 px-2 text-right">{formatAmount(inv.taxable_amount)}</td>
                          <td className="py-2 px-2 text-right font-medium">{formatAmount(inv.total_amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
