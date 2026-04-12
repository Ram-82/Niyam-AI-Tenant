import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, CheckCircle, AlertCircle } from 'lucide-react';

// Rejects obvious typos like ram@gmail.commmm (TLD max 5 chars covers .com .in .org .info .store)
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
import api from '../lib/axios.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { generateUsername } from '../lib/utils.js';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', username: '',
    phone: '', firm_name: '', membership_number: '', city: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const set = (f) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const updated = { ...p, [f]: val };
      if (f === 'full_name' && !p._usernameTouched) {
        updated.username = generateUsername(val);
      }
      return updated;
    });
    if (errors[f]) setErrors(prev => ({ ...prev, [f]: '' }));
  };

  const validate = () => {
    const errs = {};

    if (!form.full_name.trim()) {
      errs.full_name = 'Full name is required';
    } else if (form.full_name.trim().length < 2) {
      errs.full_name = 'Full name must be at least 2 characters';
    }

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

    if (!form.username.trim()) {
      errs.username = 'Username is required';
    } else if (!/^[a-z0-9_]+$/.test(form.username)) {
      errs.username = 'Only lowercase letters, numbers, and underscores allowed (e.g. rahul_sharma)';
    } else if (form.username.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const parseServerError = (err) => {
    const data = err.response?.data;
    if (!data) return 'Unable to connect to server. Please try again.';
    if (data.code === 'VALIDATION_ERROR' && Array.isArray(data.details)) {
      return data.details.map(d => d.message).join(', ') || 'Please check your input';
    }
    if (data.code === 'DUPLICATE') return data.message;
    return data.message || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { ...form, email: form.email.trim().toLowerCase() });
      if (res.data?.verified) {
        toast.success('Account created! You can now sign in.');
        navigate('/login');
      } else {
        setDone(true);
      }
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot reach the server. Check your internet connection.');
      } else {
        toast.error(err.userMessage || parseServerError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Check your email</h2>
          <p className="text-muted text-sm mb-6">
            We've sent a verification link to <strong>{form.email}</strong>.<br />
            Click it to activate your account.
          </p>
          <Link to="/login" className="btn-primary px-8 py-2.5">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-accent" />
            </div>
            <span className="text-xl font-bold text-primary">Niyam AI</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Create your CA account</h1>
          <p className="text-muted text-sm mt-1">Free to get started</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="label">Full Name *</label>
              <input
                className={`input ${errors.full_name ? 'border-danger focus:ring-danger' : ''}`}
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="CA Rahul Sharma"
                autoFocus
              />
              <FieldError message={errors.full_name} />
            </div>

            {/* Email */}
            <div>
              <label className="label">Email *</label>
              <input
                className={`input ${errors.email ? 'border-danger focus:ring-danger' : ''}`}
                type="email"
                value={form.email}
                onChange={set('email')}
                onBlur={() => {
                  if (form.email && !EMAIL_REGEX.test(form.email.trim())) {
                    setErrors(prev => ({ ...prev, email: 'Please enter a valid email address (e.g. name@gmail.com)' }));
                  }
                }}
                placeholder="rahul@gmail.com"
                autoComplete="email"
              />
              <FieldError message={errors.email} />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  className={`input pr-10 ${errors.password ? 'border-danger focus:ring-danger' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>
            <div>
              <label className="label">Username *</label>
              <input
                className={`input ${errors.username ? 'border-danger focus:ring-danger' : ''}`}
                value={form.username}
                onChange={(e) => {
                  setForm(p => ({ ...p, username: e.target.value.toLowerCase(), _usernameTouched: true }));
                  if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                }}
                placeholder="rahul_sharma"
                autoComplete="username"
              />
              <FieldError message={errors.username} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              <Input label="City" value={form.city} onChange={set('city')} placeholder="Mumbai" />
            </div>
            <Input label="Firm Name" value={form.firm_name} onChange={set('firm_name')} placeholder="Sharma & Associates" />
            <Input label="ICAI Membership No. (optional)" value={form.membership_number} onChange={set('membership_number')} placeholder="e.g. 123456" />
            <Button type="submit" loading={loading} className="w-full">Create Account</Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
