import React, { useState } from 'react';
import Input, { Textarea, Select } from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';

const BUSINESS_TYPES = ['Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'HUF', 'Trust', 'Other'];

export default function ClientForm({ initialData = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: initialData.name || '',
    gstin: initialData.gstin || '',
    pan: initialData.pan || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    business_type: initialData.business_type || '',
    notes: initialData.notes || '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Client name is required';
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin)) {
      errs.gstin = 'Invalid GSTIN format';
    }
    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan)) {
      errs.pan = 'Invalid PAN format';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Client Name *" value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Sharma Traders" />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="GSTIN"
          value={form.gstin}
          onChange={(e) => setForm(p => ({ ...p, gstin: e.target.value.toUpperCase() }))}
          error={errors.gstin}
          placeholder="22AAAAA0000A1Z5"
          className="font-mono text-sm"
          maxLength={15}
        />
        <Input
          label="PAN"
          value={form.pan}
          onChange={(e) => setForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))}
          error={errors.pan}
          placeholder="AAAAA0000A"
          className="font-mono text-sm"
          maxLength={10}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="client@example.com" />
        <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" maxLength={15} />
      </div>
      <Select label="Business Type" value={form.business_type} onChange={set('business_type')}>
        <option value="">Select type...</option>
        {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </Select>
      <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={3} placeholder="Any notes about this client..." />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {initialData.id ? 'Save Changes' : 'Add Client'}
        </Button>
      </div>
    </form>
  );
}
