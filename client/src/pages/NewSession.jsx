import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/axios.js';
import DropZone from '../components/upload/DropZone.jsx';
import UploadProgress from '../components/upload/UploadProgress.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { formatMonth } from '../lib/utils.js';
import toast from 'react-hot-toast';

export default function NewSession() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null); // null | processing | completed | failed
  const pollRef = useRef(null);

  useEffect(() => {
    fetchSession();
    return () => clearInterval(pollRef.current);
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const { data } = await api.get(`/sessions/${sessionId}`);
      setSession(data);
      if (data.status === 'completed') {
        navigate(`/sessions/${sessionId}/results`);
      } else if (data.status === 'processing') {
        setProcessingStatus('processing');
        startPolling();
      }
    } catch {
      toast.error('Session not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/sessions/${sessionId}`);
        if (data.status === 'completed') {
          clearInterval(pollRef.current);
          setProcessingStatus('completed');
          setTimeout(() => navigate(`/sessions/${sessionId}/results`), 1200);
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current);
          setProcessingStatus('failed');
        }
      } catch {}
    }, 3000);
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast.error('Please add at least one file');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    try {
      await api.post(`/upload/${sessionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProcessingStatus('processing');
      startPolling();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(`/clients/${session.client_id}`)} className="flex items-center gap-2 text-muted hover:text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Client
      </button>

      <div className="card p-6">
        <div className="mb-5">
          <div className="text-xs text-muted uppercase tracking-wide mb-1">Upload Session</div>
          <h1 className="text-xl font-bold text-primary">{session.clients?.name}</h1>
          <p className="text-muted text-sm">{formatMonth(session.month)}</p>
        </div>

        {processingStatus ? (
          <UploadProgress status={processingStatus} />
        ) : (
          <>
            <DropZone files={files} onChange={setFiles} />
            <div className="mt-5 flex justify-end">
              <Button
                onClick={handleUpload}
                loading={uploading}
                disabled={!files.length}
                size="lg"
              >
                Process Documents
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
