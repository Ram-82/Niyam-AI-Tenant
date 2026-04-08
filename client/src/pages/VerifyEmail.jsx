import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');

  // This page just shows a message - actual verification is handled by backend redirect
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={32} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">Verify your email</h2>
        <p className="text-muted text-sm mb-6">
          Check your inbox for the verification link we sent you. Click it to activate your account.
        </p>
        <Link to="/login" className="btn-primary px-8 py-2.5">Go to Login</Link>
      </div>
    </div>
  );
}
