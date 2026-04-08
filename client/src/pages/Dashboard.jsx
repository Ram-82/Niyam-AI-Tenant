import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useClients } from '../hooks/useClients.js';
import api from '../lib/axios.js';
import StatsBar from '../components/dashboard/StatsBar.jsx';
import RecentSessions from '../components/dashboard/RecentSessions.jsx';
import ClientList from '../components/clients/ClientList.jsx';
import Card, { CardHeader, CardTitle } from '../components/ui/Card.jsx';

export default function Dashboard() {
  const { ca } = useAuth();
  const { clients, loading, createClient, fetchClients } = useClients();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    sessionsThisMonth: 0,
    reportsGenerated: 0,
    issuesThisMonth: 0,
  });

  useEffect(() => {
    fetchRecentSessions();
  }, []);

  useEffect(() => {
    if (!loading) {
      setStats(prev => ({ ...prev, totalClients: clients.length }));
    }
  }, [clients, loading]);

  const fetchRecentSessions = async () => {
    try {
      // Get recent sessions from reports endpoint
      const { data: reports } = await api.get('/reports');
      const thisMonth = new Date().toISOString().substring(0, 7);

      // Get sessions from clients
      const { data: clientsList } = await api.get('/clients');
      const allSessions = [];

      // Fetch last 5 reports as "recent sessions"
      const recentReports = reports.slice(0, 10);

      setStats({
        totalClients: clientsList.length,
        sessionsThisMonth: reports.filter(r => r.month === thisMonth).length,
        reportsGenerated: reports.length,
        issuesThisMonth: reports
          .filter(r => r.month === thisMonth)
          .reduce((sum, r) => sum + (r.total_flags || 0), 0),
      });

      // Get actual sessions for the table
      const sessionData = reports.slice(0, 8).map(r => ({
        id: r.session_id,
        month: r.month,
        status: 'completed',
        file_count: r.total_invoices,
        created_at: r.generated_at,
        clients: r.clients,
      }));
      setSessions(sessionData);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">
          Good {getGreeting()}, {ca?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-muted text-sm mt-1">Here's your client overview</p>
      </div>

      <StatsBar stats={stats} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Clients</CardTitle>
            </CardHeader>
            <ClientList clients={clients} loading={loading} onAdd={async (data) => { await createClient(data); fetchRecentSessions(); }} />
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <RecentSessions sessions={sessions} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
