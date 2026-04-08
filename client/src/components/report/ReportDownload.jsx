import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import api from '../../lib/axios.js';
import Button from '../ui/Button.jsx';
import toast from 'react-hot-toast';

export default function ReportDownload({ report, sessionId }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!report?.id) {
      toast.error('Report not available yet');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/${report.id}/download`);
      window.open(data.url, '_blank');
    } catch (err) {
      toast.error('Failed to get download link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleDownload} loading={loading} size="lg" className="gap-2">
      <Download size={18} />
      Download PDF Report
    </Button>
  );
}
