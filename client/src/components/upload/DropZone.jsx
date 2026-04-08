import React, { useCallback, useState } from 'react';
import { Upload, FileText, Table, Image, X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const ACCEPTED = '.pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png';
const MAX_FILES = 10;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function fileIcon(type) {
  if (type?.includes('pdf')) return <FileText size={16} className="text-red-500" />;
  if (type?.includes('sheet') || type?.includes('excel') || type?.includes('csv')) return <Table size={16} className="text-green-600" />;
  if (type?.includes('image')) return <Image size={16} className="text-blue-500" />;
  return <FileText size={16} className="text-muted" />;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DropZone({ files, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const addFiles = useCallback((newFiles) => {
    setError('');
    const valid = [];
    for (const f of newFiles) {
      if (f.size > MAX_SIZE) { setError(`"${f.name}" exceeds 10MB`); continue; }
      valid.push(f);
    }
    const combined = [...files, ...valid].slice(0, MAX_FILES);
    if (files.length + newFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
    }
    onChange(combined);
  }, [files, onChange]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const onInputChange = (e) => addFiles(Array.from(e.target.files));
  const removeFile = (idx) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
          dragging ? 'border-accent bg-orange-50' : 'border-border hover:border-accent/50 hover:bg-surface'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={onInputChange}
        />
        <Upload size={32} className={cn('mx-auto mb-3', dragging ? 'text-accent' : 'text-muted')} />
        <div className="font-semibold text-primary mb-1">
          {dragging ? 'Drop files here' : 'Drag & drop files here'}
        </div>
        <div className="text-sm text-muted mb-3">or click to browse</div>
        <div className="text-xs text-muted">PDF, Excel, CSV, JPG, PNG — max 10 files, 10MB each</div>
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border">
              {fileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted">{formatSize(file.size)}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="p-1 rounded hover:bg-surface text-muted hover:text-danger transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
