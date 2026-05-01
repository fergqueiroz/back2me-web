import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminChatsPage({ searchParams }) {
  const supabase = createAdminClient();
  const filter = searchParams?.filter || 'all';

  let query = supabase
    .from('chat_sessions')
    .select(`
      id,
      finder_session_id,
      status,
      created_at,
      tag:tags(id, qr_code, assigned_to, owner:profiles(id, name, email))
    `)
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: sessions, error } = await query;
  if (error) console.error('Error fetching chat sessions:', error);

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-page-title">Active Chats</h1>
          <p className="admin-page-subtitle">Monitor conversations between finders and owners.</p>
        </div>
        
        <form method="GET" action="/admin/chats" style={{ display: 'flex', gap: '8px' }}>
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
            <option value="all">All Chats</option>
            <option value="active">Active Only</option>
            <option value="closed">Closed Only</option>
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
              <th>Date Started</th>
              <th>Asset / Tag</th>
              <th>Owner Details</th>
              <th>Finder ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!sessions || sessions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No chat sessions found.
                </td>
              </tr>
            ) : (
              sessions.map(session => (
                <tr key={session.id}>
                  <td style={{ fontSize: '13px' }}>
                    {new Date(session.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{session.tag?.assigned_to || 'Unnamed Asset'}</div>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>
                      {session.tag?.qr_code}
                    </div>
                  </td>
                  <td>
                    {session.tag?.owner ? (
                      <div>
                        <div style={{ fontWeight: '500' }}>{session.tag.owner.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{session.tag.owner.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Orphaned Tag</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#4b5563', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {session.finder_session_id}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      backgroundColor: session.status === 'active' ? '#d1fae5' : '#f3f4f6',
                      color: session.status === 'active' ? '#065f46' : '#4b5563',
                      textTransform: 'uppercase'
                    }}>
                      {session.status}
                    </span>
                  </td>
                  <td>
                    <Link 
                      href={`/admin/chats/${session.id}`}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: '1px solid #e5e7eb',
                        display: 'inline-block'
                      }}
                    >
                      Audit Log
                    </Link>
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
