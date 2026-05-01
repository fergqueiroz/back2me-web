import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminTagsPage({ searchParams }) {
  const supabase = createAdminClient();
  const search = searchParams?.search || '';
  const filter = searchParams?.filter || 'all';

  // Build query
  let query = supabase
    .from('tags')
    .select(`
      id,
      qr_code,
      type,
      status,
      assigned_to,
      created_at,
      activated_at,
      owner:profiles(id, name, email)
    `)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`qr_code.ilike.%${search}%,assigned_to.ilike.%${search}%`);
  }

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: tags, error } = await query;
  if (error) console.error('Error fetching tags:', error);

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-page-title">Tags & Inventory</h1>
          <p className="admin-page-subtitle">Master list of all generated QR codes and physical assets.</p>
        </div>
        
        <form method="GET" action="/admin/tags" style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            name="search" 
            placeholder="Search QR or name..." 
            defaultValue={search}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #d1d5db',
              fontSize: '14px',
              width: '200px'
            }} 
          />
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
            <option value="unregistered">Unregistered</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
              <th>QR Code / Asset</th>
              <th>Type</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Activated Date</th>
            </tr>
          </thead>
          <tbody>
            {!tags || tags.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No tags found.
                </td>
              </tr>
            ) : (
              tags.map(tag => (
                <tr key={tag.id}>
                  <td>
                    <div style={{ fontWeight: '600', fontFamily: 'monospace', color: '#2563eb' }}>{tag.qr_code}</div>
                    <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px' }}>{tag.assigned_to || '—'}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                      {tag.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      backgroundColor: tag.status === 'active' ? '#d1fae5' : tag.status === 'unregistered' ? '#f3f4f6' : '#fef3c7',
                      color: tag.status === 'active' ? '#065f46' : tag.status === 'unregistered' ? '#4b5563' : '#92400e',
                      textTransform: 'uppercase'
                    }}>
                      {tag.status}
                    </span>
                  </td>
                  <td>
                    {tag.owner ? (
                      <div>
                        <Link href={`/admin/users/${tag.owner.id}`} style={{ fontWeight: '500', color: '#111827', textDecoration: 'none' }}>
                          {tag.owner.name || 'Unknown'} ↗
                        </Link>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{tag.owner.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ fontSize: '13px', color: '#4b5563' }}>
                    {tag.activated_at ? new Date(tag.activated_at).toLocaleDateString() : '—'}
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
