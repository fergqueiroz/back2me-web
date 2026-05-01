import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FlagSupportButton } from './BillingActionsUI';

export default async function AdminBillingPage({ searchParams }) {
  const supabase = createAdminClient();
  const filter = searchParams?.filter || 'all';

  // Build query for profiles to see billing details
  let query = supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      plan,
      plan_status,
      stripe_customer_id,
      subscription_id,
      support_flag,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (filter === 'flagged') {
    query = query.eq('support_flag', true);
  } else if (filter !== 'all') {
    query = query.eq('plan_status', filter);
  }

  const { data: accounts, error } = await query;
  if (error) console.error('Error fetching billing data:', error);

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-page-title">Billing & Subscriptions</h1>
          <p className="admin-page-subtitle">Manage customer plans and Stripe integrations.</p>
        </div>
        
        <form method="GET" action="/admin/billing" style={{ display: 'flex', gap: '8px' }}>
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
            <option value="all">All Subscribers</option>
            <option value="active">Active Members</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
            <option value="incomplete">Incomplete</option>
            <option value="flagged">Needs Attention (Flagged)</option>
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
              <th>Customer</th>
              <th>Current Plan</th>
              <th>Status</th>
              <th>Stripe Customer ID</th>
              <th>Subscription ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!accounts || accounts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No billing records found.
                </td>
              </tr>
            ) : (
              accounts.map(acc => (
                <tr key={acc.id} style={{ backgroundColor: acc.support_flag ? '#fff1f2' : 'transparent', borderLeft: acc.support_flag ? '3px solid #e11d48' : 'none' }}>
                  <td>
                    <div style={{ fontWeight: '500', color: acc.support_flag ? '#be123c' : 'inherit' }}>
                      {acc.support_flag && '🚩 '}
                      {acc.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{acc.email}</div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '700',
                      backgroundColor: acc.plan === 'elite' ? '#fee2e2' : acc.plan === 'plus' ? '#e0e7ff' : '#f3f4f6',
                      color: acc.plan === 'elite' ? '#991b1b' : acc.plan === 'plus' ? '#3730a3' : '#4b5563',
                      textTransform: 'uppercase'
                    }}>
                      {acc.plan}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      backgroundColor: acc.plan_status === 'active' ? '#d1fae5' : acc.plan_status === 'cancelled' ? '#f3f4f6' : '#fef3c7',
                      color: acc.plan_status === 'active' ? '#065f46' : acc.plan_status === 'cancelled' ? '#4b5563' : '#92400e',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {acc.plan_status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#4b5563' }}>
                      {acc.stripe_customer_id || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#4b5563' }}>
                      {acc.subscription_id || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link 
                        href={`/admin/users/${acc.id}`}
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
                        Profile
                      </Link>
                      <FlagSupportButton userId={acc.id} isFlagged={acc.support_flag} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
