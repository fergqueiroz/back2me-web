import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminLogsPage() {
  const supabase = createAdminClient();

  const { data: logs, error } = await supabase
    .from('admin_audit_logs')
    .select(`
      *,
      admin:profiles(name, email, role)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) console.error('Error fetching audit logs:', error);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Audit Logs</h1>
        <p className="admin-page-subtitle">Presents a ledger of all sensitive administrative actions taken on the platform.</p>
      </div>

      <div className="admin-card" style={{ marginBottom: '24px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#3730a3', fontSize: '15px' }}>Security & Auditing Model</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#4338ca', lineHeight: '1.5' }}>
          This is an immutable log. Any disruptive actions taken by moderators, admins, or support personnel (such as blocking a chat, refunding a Stripe charge, or altering a customer's plan manually) are permanently written here for accountability.
        </p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrator</th>
              <th>Action</th>
              <th>Target</th>
              <th>Metadata Snapshot</th>
            </tr>
          </thead>
          <tbody>
            {!logs || logs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                  No administrative actions have been recorded yet.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <div>{new Date(log.created_at).toLocaleDateString()}</div>
                    <div style={{ color: '#6b7280' }}>{new Date(log.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{log.admin?.name || 'System Auto'}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{log.admin?.role?.toUpperCase()}</div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      backgroundColor: '#fcd34d',
                      color: '#92400e',
                      fontFamily: 'monospace'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500', textTransform: 'capitalize' }}>{log.target_type}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6b7280', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.target_id}
                    </div>
                  </td>
                  <td>
                    <div style={{ 
                      fontSize: '11px', 
                      fontFamily: 'monospace', 
                      backgroundColor: '#f9fafb', 
                      padding: '8px', 
                      borderRadius: '6px', 
                      border: '1px solid #e5e7eb',
                      maxHeight: '60px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      maxWidth: '300px'
                    }}>
                      {log.metadata ? JSON.stringify(log.metadata, null, 2) : '{}'}
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
