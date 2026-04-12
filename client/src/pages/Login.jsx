import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import api from '../lib/axios.js';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

// Validates email format — rejects obvious typos like ram@gmail.commmm
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,5}$/;

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
      <AlertCircle size={12} className="flex-shrink-0" />
      {message}
    </p>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error as user starts typing
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};

    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. name@gmail.com)';
    }

    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Parse server-side Zod validation errors into human-readable messages
  const parseServerError = (err) => {
    const data = err.response?.data;
    if (!data) return 'Unable to connect to server. Please try again.';

    // Zod field-level errors
    if (data.code === 'VALIDATION_ERROR' && Array.isArray(data.details)) {
      const fieldMessages = data.details.map(d => d.message).join(', ');
      return fieldMessages || 'Please check your input and try again';
    }

    return data.message || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      login(data.accessToken, data.ca);
      toast.success(`Welcome back, ${data.ca.full_name}!`);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;

      if (status === 401 && code === 'INVALID_CREDENTIALS') {
        // Show inline errors on both fields — don't reveal which is wrong
        setErrors({
          email: ' ', // space keeps layout but shows border without text
          password: 'Incorrect email or password. Please try again.',
        });
      } else if (status === 401 && code === 'EMAIL_NOT_VERIFIED') {
        setErrors({ email: 'Your email is not verified yet. Check your inbox for the verification link.' });
      } else if (status === 400) {
        toast.error(parseServerError(err));
      } else if (!err.response) {
        toast.error('Cannot reach the server. Check your internet connection.');
      } else {
        toast.error(parseServerError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-accent" />
            </div>
            <span className="text-xl font-bold text-primary">Niyam AI</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Sign in to your account</h1>
          <p className="text-muted text-sm mt-1">GST Pre-Filing Intelligence for CAs</p>
        </div>

        {params.get('verified') === 'true' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-success text-center">
            Email verified! You can now log in.
          </div>
        )}

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                className={`input ${errors.email && errors.email.trim() ? 'border-danger focus:ring-danger' : ''}`}
                type="email"
                value={form.email}
                onChange={set('email')}
                onBlur={() => {
                  if (form.email && !EMAIL_REGEX.test(form.email.trim())) {
                    setErrors(prev => ({ ...prev, email: 'Please enter a valid email address (e.g. name@gmail.com)' }));
                  }
                }}
                placeholder="you@gmail.com"
                autoComplete="email"
                autoFocus
              />
              <FieldError message={errors.email?.trim() ? errors.email : ''} />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className={`input pr-10 ${errors.password ? 'border-danger focus:ring-danger' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            <div className="flex justify-end -mt-2">
              <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent font-semibold hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
