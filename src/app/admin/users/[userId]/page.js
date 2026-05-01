import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CustomerEditForm, CustomerDangerZone, TagStatusToggle, SupportNotesForm } from './CustomerActionsUI';

export default async function AdminUserDetailPage({ params }) {
  const { userId } = await params;
  const supabase = createAdminClient();

  // Fetch all user related data in parallel
  const [
    { data: user, error: userError },
    { data: tags, error: tagsError },
    { data: shipments, error: shipmentsError }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('tags').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('shipments').select('*').eq('owner_id', userId).order('created_at', { ascending: false })
  ]);

  if (userError || !user) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <h2 style={{ color: '#dc2626' }}>User Not Found</h2>
          <p>Could not load user data. Error: {userError?.message}</p>
          <Link href="/admin/users" style={{ color: '#4b5563' }}>← Back to Users</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <Link href="/admin/users" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>
          ← Back to Customers
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="admin-page-title">{user.name || 'Unnamed User'}</h1>
            <p className="admin-page-subtitle">{user.email} • Joined {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span style={{ 
              padding: '4px 12px', 
              borderRadius: '16px', 
              fontSize: '13px', 
              fontWeight: '700',
              backgroundColor: user.plan_status === 'active' ? '#d1fae5' : '#fef3c7',
              color: user.plan_status === 'active' ? '#065f46' : '#92400e',
              textTransform: 'uppercase',
              border: '1px solid currentColor'
            }}>
              {user.plan || 'starter'} - {user.plan_status || 'Incomplete'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        
        {/* Left Column: Profile Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="admin-card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Customer Details</h2>
            
            <CustomerEditForm user={user} />
            
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Stripe Customer ID</div>
                <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'monospace' }}>{user.stripe_customer_id || 'None'}</div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Shipping Address</h2>
            
            {user.shipping_street ? (
              <div style={{ marginTop: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                <div style={{ fontWeight: '600' }}>{user.shipping_name || user.name}</div>
                <div>{user.shipping_street}</div>
                <div>{user.shipping_city}, {user.shipping_state} {user.shipping_zip}</div>
                <div>{user.shipping_country}</div>
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '16px' }}>No shipping address provided.</p>
            )}
          </div>
          
          <SupportNotesForm user={user} />

          <CustomerDangerZone user={user} />
        </div>

        {/* Right Column: Tags & Shipments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Linked Tags */}
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Registered Tags ({tags?.length || 0})</h2>
            </div>
            {tags && tags.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tag / Asset</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Activated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map(tag => (
                    <tr key={tag.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{tag.assigned_to || tag.qr_code}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>{tag.qr_code}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', textTransform: 'capitalize', color: '#4b5563' }}>{tag.type?.replace('_', ' ')}</span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: tag.status === 'active' ? '#d1fae5' : '#f3f4f6',
                          color: tag.status === 'active' ? '#065f46' : '#4b5563',
                          fontWeight: '600'
                        }}>
                          {tag.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#4b5563' }}>
                        {tag.activated_at ? new Date(tag.activated_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <TagStatusToggle tagId={tag.id} currentStatus={tag.status} userId={userId} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>No tags registered.</div>
            )}
          </div>

          {/* Shipment History */}
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Logistics History ({shipments?.length || 0})</h2>
            </div>
            {shipments && shipments.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tracking</th>
                    <th>Status</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map(shipment => (
                    <tr key={shipment.id}>
                      <td style={{ fontSize: '13px' }}>
                        {new Date(shipment.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {shipment.tracking_code ? (
                           <div style={{ fontWeight: '500', fontFamily: 'monospace', color: '#2563eb' }}>{shipment.tracking_code}</div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Pending Payment</span>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: shipment.status === 'label_generated' ? '#dbeafe' : shipment.status === 'awaiting_owner_payment' ? '#fef3c7' : '#f3f4f6',
                          color: shipment.status === 'label_generated' ? '#1e40af' : shipment.status === 'awaiting_owner_payment' ? '#92400e' : '#4b5563',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {shipment.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '14px', fontWeight: '500', color: shipment.final_price ? '#10b981' : '#9ca3af' }}>
                        {shipment.final_price ? `$${shipment.final_price}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>No shipments found.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
