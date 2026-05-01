import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminScansPage() {
  const supabase = createAdminClient();

  // Query global scan events
  const { data: scans, error } = await supabase
    .from('scan_events')
    .select(`
      id,
      finder_session_id,
      latitude,
      longitude,
      city,
      country,
      created_at,
      tag:tags(qr_code, type, assigned_to, status, owner:profiles(id, name, email))
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching global scan events:', error);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Global Scan Feed</h1>
        <p className="admin-page-subtitle">Real-time log of every time a Back2Me tag is scanned.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Scanned Asset</th>
              <th>Owner Details</th>
              <th>Finder Identity / Auth</th>
              <th>Approx. Location</th>
            </tr>
          </thead>
          <tbody>
            {!scans || scans.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No scans recorded on the platform yet.
                </td>
              </tr>
            ) : (
              scans.map(scan => (
                <tr key={scan.id}>
                  <td style={{ fontSize: '13px' }}>
                    <div style={{ fontWeight: '500' }}>{new Date(scan.created_at).toLocaleDateString()}</div>
                    <div style={{ color: '#6b7280', marginTop: '2px' }}>{new Date(scan.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{scan.tag?.assigned_to || 'Unnamed'}</div>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#2563eb' }}>
                      <Link href={`/admin/tags?search=${scan.tag?.qr_code}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {scan.tag?.qr_code} ↗
                      </Link>
                    </div>
                  </td>
                  <td>
                    {scan.tag?.owner ? (
                      <div>
                        <Link href={`/admin/users/${scan.tag.owner.id}`} style={{ fontWeight: '500', color: '#111827', textDecoration: 'none' }}>
                          {scan.tag.owner.name} ↗
                        </Link>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{scan.tag.owner.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' }}>Orphaned</span>
                    )}
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '11px', 
                      fontFamily: 'monospace', 
                      backgroundColor: '#f3f4f6', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      color: '#4b5563',
                      display: 'inline-block',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {scan.finder_session_id}
                    </span>
                  </td>
                  <td>
                    {scan.city ? (
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{scan.city}, {scan.country}</div>
                    ) : scan.latitude ? (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Lat: {scan.latitude.toFixed(4)}, Lng: {scan.longitude.toFixed(4)}</div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Location hidden</div>
                    )}
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
