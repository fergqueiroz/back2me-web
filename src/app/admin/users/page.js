import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminUsersPage({ searchParams }) {
  const supabase = createAdminClient();
  const search = searchParams?.search || '';

  // Query users (profiles)
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      name,
      plan,
      plan_status,
      role,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-page-title">Customer Management</h1>
          <p className="admin-page-subtitle">View and manage all registered users.</p>
        </div>
        
        {/* Simple Search Form */}
        <form method="GET" action="/admin/users" style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            name="search" 
            placeholder="Search name or email..." 
            defaultValue={search}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #d1d5db',
              fontSize: '14px',
              width: '250px'
            }} 
          />
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
            Search
          </button>
        </form>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!users || users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{user.name || 'No Name'}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>{user.email || '—'}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      backgroundColor: user.plan === 'elite' ? '#fee2e2' : user.plan === 'plus' ? '#e0e7ff' : '#f3f4f6',
                      color: user.plan === 'elite' ? '#991b1b' : user.plan === 'plus' ? '#3730a3' : '#4b5563',
                      textTransform: 'uppercase'
                    }}>
                      {user.plan || 'starter'}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      backgroundColor: user.plan_status === 'active' ? '#d1fae5' : '#fef3c7',
                      color: user.plan_status === 'active' ? '#065f46' : '#92400e'
                    }}>
                      {user.plan_status === 'active' ? 'Active' : (user.plan_status || 'Incomplete')}
                    </span>
                  </td>
                  <td>
                     <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '600',
                      color: user.role === 'admin' ? '#f97316' : '#6b7280'
                    }}>
                      {user.role?.toUpperCase() || 'USER'}
                    </span>
                  </td>
                  <td>
                    <Link 
                      href={`/admin/users/${user.id}`}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
