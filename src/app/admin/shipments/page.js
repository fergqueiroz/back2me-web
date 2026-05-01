import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminShipmentsPage({ searchParams }) {
  const supabase = createAdminClient();
  const filter = searchParams?.filter || 'all';

  // Build query
  let query = supabase
    .from('shipments')
    .select(`
      id,
      tracking_code,
      status,
      created_at,
      final_price,
      owner:profiles(name, email)
    `)
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: shipments, error } = await query;

  if (error) console.error('Error fetching shipments:', error);

  const getStatusColor = (status) => {
    switch(status) {
      case 'awaiting_owner_payment': return { bg: '#fef3c7', text: '#92400e' };
      case 'label_generated': return { bg: '#dbeafe', text: '#1e40af' };
      case 'in_transit': return { bg: '#e0e7ff', text: '#3730a3' };
      case 'delivered': return { bg: '#d1fae5', text: '#065f46' };
      default: return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-page-title">Logistics & Shipments</h1>
          <p className="admin-page-subtitle">Master list of all Mail It Back requests.</p>
        </div>
        
        {/* Status Filter */}
        <form method="GET" action="/admin/shipments" style={{ display: 'flex', gap: '8px' }}>
          <select 
            name="filter" 
            defaultValue={filter}
            onChange="this.form.submit()"
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="awaiting_owner_payment">Awaiting Payment</option>
            <option value="label_generated">Label Generated</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
          <button 
            type="submit" 
            style={{
              padding: '8px 16px',
              backgroundColor: '#1f2937',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Filter
          </button>
        </form>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Tracking / ID</th>
              <th>Status</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!shipments || shipments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                   No shipments found matching the criteria.
                </td>
              </tr>
            ) : (
              shipments.map(s => {
                const colors = getStatusColor(s.status);
                return (
                  <tr key={s.id}>
                    <td style={{ fontSize: '13px' }}>
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{s.owner?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{s.owner?.email}</div>
                    </td>
                    <td>
                      {s.tracking_code ? (
                         <div style={{ fontWeight: '600', fontFamily: 'monospace', color: '#2563eb' }}>
                           {s.tracking_code}
                         </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                          ID: {s.id.split('-')[0]}...
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        fontWeight: '700',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {s.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500', color: s.final_price ? '#10b981' : '#9ca3af' }}>
                       {s.final_price ? `$${s.final_price}` : '—'}
                    </td>
                    <td>
                      <Link 
                        href={`/admin/shipments/${s.id}`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
