import { createAdminClient } from '@/lib/supabase/server';

export default async function AdminDashboardOverview() {
  const supabase = createAdminClient();

  // Basic stats logic for MVP implementation preview
  const [{ count: userCount }, { count: tagCount }, { count: shipmentCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tags').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'awaiting_owner_payment')
  ]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Business Overview</h1>
        <p className="admin-page-subtitle">Real-time stats for Back2Me Logistics & Operations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Total Users</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: '800' }}>{userCount || 0}</p>
        </div>
        <div className="admin-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Active Tags</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: '800' }}>{tagCount || 0}</p>
        </div>
        <div className="admin-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Pending Shipments</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: '800' }}>{shipmentCount || 0}</p>
        </div>
      </div>

      <div className="admin-card">
        <h3>Welcome to the Back2Me Admin Panel</h3>
        <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
          This area is successfully secured and protected by role-based access control. 
          Use the left sidebar to navigate the system. Subsequent phases will build out the Customer, Logistics, and Chat management interfaces.
        </p>
      </div>
    </div>
  );
}
