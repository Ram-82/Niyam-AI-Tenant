import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import api from '../lib/axios.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.accessToken, data.ca);
      toast.success(`Welcome back, ${data.ca.full_name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              required
              autoFocus
            />
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" loading={loading} className="w-full">Sign In</Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent font-semibold hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
