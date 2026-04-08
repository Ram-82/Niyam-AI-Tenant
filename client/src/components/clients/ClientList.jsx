import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import ClientCard from './ClientCard.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import ClientForm from './ClientForm.jsx';
import Spinner from '../ui/Spinner.jsx';
import toast from 'react-hot-toast';

export default function ClientList({ clients, loading, onAdd }) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (data) => {
    setAdding(true);
    try {
      await onAdd(data);
      toast.success(`${data.name} added successfully`);
      setShowAdd(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add client');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Search by name or GSTIN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus size={16} />
          Add Client
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-muted text-sm">
            {search ? 'No clients match your search.' : 'No clients yet. Add your first client to get started.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => <ClientCard key={client.id} client={client} />)}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Client">
        <ClientForm onSubmit={handleAdd} loading={adding} />
      </Modal>
    </div>
  );
}
