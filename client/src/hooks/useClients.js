import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios.js';
import toast from 'react-hot-toast';

export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients');
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (clientData) => {
    const { data } = await api.post('/clients', clientData);
    setClients(prev => [data, ...prev]);
    return data;
  };

  const updateClient = async (id, updates) => {
    const { data } = await api.put(`/clients/${id}`, updates);
    setClients(prev => prev.map(c => c.id === id ? data : c));
    return data;
  };

  const deleteClient = async (id) => {
    await api.delete(`/clients/${id}`);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  return { clients, loading, error, fetchClients, createClient, updateClient, deleteClient };
}
