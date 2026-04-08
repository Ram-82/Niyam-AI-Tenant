import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import api from '../lib/axios.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Card, { CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { ca, updateCa } = useAuth();
  const [form, setForm] = useState({
    full_name: ca?.full_name || '',
    phone: ca?.phone || '',
    firm_name: ca?.firm_name || '',
    membership_number: ca?.membership_number || '',
    city: ca?.city || '',
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const setPw = (f) => (e) => setPwForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateCa(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-primary mb-6">Profile Settings</h1>

      {/* Account Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div className="text-muted text-xs mb-1">Email</div>
            <div className="font-medium">{ca?.email}</div>
          </div>
          <div>
            <div className="text-muted text-xs mb-1">Username</div>
            <div className="font-mono font-medium">@{ca?.username}</div>
          </div>
          <div>
            <div className="text-muted text-xs mb-1">Member Since</div>
            <div className="font-medium">{ca?.created_at ? new Date(ca.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</div>
          </div>
        </div>
      </Card>

      {/* Profile form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={set('full_name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            <Input label="City" value={form.city} onChange={set('city')} placeholder="Mumbai" />
          </div>
          <Input label="Firm Name" value={form.firm_name} onChange={set('firm_name')} placeholder="Sharma & Associates" />
          <Input label="ICAI Membership Number" value={form.membership_number} onChange={set('membership_number')} placeholder="e.g. 123456" />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input className="input pr-10" type={showPw ? 'text' : 'password'} value={pwForm.current_password} onChange={setPw('current_password')} placeholder="Enter current password" />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Input label="New Password" type="password" value={pwForm.new_password} onChange={setPw('new_password')} placeholder="Min. 8 characters" />
          <Input label="Confirm New Password" type="password" value={pwForm.confirm} onChange={setPw('confirm')} placeholder="Repeat new password" />
          <div className="flex justify-end">
            <Button type="submit" loading={savingPw}>Change Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
