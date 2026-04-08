import React from 'react';
import Spinner from '../ui/Spinner.jsx';

export default function UploadProgress({ status }) {
  const messages = {
    uploading: 'Uploading documents...',
    processing: 'Extracting invoice data and running validation checks...',
    completed: 'Processing complete!',
    failed: 'Processing failed.',
  };

  return (
    <div className="text-center py-10">
      {status !== 'completed' && status !== 'failed' && (
        <Spinner size="lg" className="mx-auto mb-4" />
      )}
      <div className="font-semibold text-primary mb-2">{messages[status] || 'Processing...'}</div>
      <div className="text-sm text-muted">
        {status === 'processing' && 'This may take a moment. You\'ll be redirected automatically when done.'}
        {status === 'completed' && 'Redirecting to results...'}
      </div>
    </div>
  );
}
