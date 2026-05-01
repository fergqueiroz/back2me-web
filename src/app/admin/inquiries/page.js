import { createAdminClient } from '@/lib/supabase/server';

function fmtDate(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function InquiriesPage() {
  const supabase = createAdminClient();

  const { data: inquiries, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Luxury Brand Inquiries</h1>
        </div>
        <div className="admin-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <p style={{ color: '#ef4444', margin: 0 }}>
            Could not load inquiries. Make sure the <code>inquiries</code> table exists in Supabase.
          </p>
          <details style={{ marginTop: '12px' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#6b7280' }}>Setup SQL</summary>
            <pre style={{ marginTop: '10px', background: '#f9fafb', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto' }}>{`CREATE TABLE inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);`}</pre>
          </details>
        </div>
      </div>
    );
  }

  const unread = (inquiries || []).filter(i => !i.read).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Luxury Brand Inquiries</h1>
          <p className="admin-page-subtitle">Messages received via the &quot;Inquire for Luxury Brands&quot; form</p>
        </div>
        {unread > 0 && (
          <span style={{
            background: 'var(--orange)', color: '#fff',
            fontSize: '0.78rem', fontWeight: '700',
            padding: '4px 12px', borderRadius: '99px',
            alignSelf: 'center',
          }}>
            {unread} unread
          </span>
        )}
      </div>

      {/* Summary card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid var(--orange)' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Total Inquiries</h3>
          <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: '800' }}>{inquiries?.length ?? 0}</p>
        </div>
        <div className="admin-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Unread</h3>
          <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: '800' }}>{unread}</p>
        </div>
      </div>

      {/* Inquiry list */}
      {!inquiries || inquiries.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#6b7280', margin: 0 }}>No inquiries received yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {inquiries.map(inq => (
            <div
              key={inq.id}
              className="admin-card"
              style={{
                borderLeft: `4px solid ${inq.read ? 'var(--border-gray)' : 'var(--orange)'}`,
                position: 'relative',
              }}
            >
              {!inq.read && (
                <span style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'rgba(255,90,34,0.12)', color: 'var(--orange)',
                  fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.06em',
                  textTransform: 'uppercase', padding: '2px 8px', borderRadius: '99px',
                }}>
                  New
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>{inq.email}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{fmtDate(inq.created_at)}</span>
              </div>
              <p style={{ margin: 0, color: '#374151', fontSize: '0.93rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {inq.message}
              </p>
              <div style={{ marginTop: '14px' }}>
                <a
                  href={`mailto:${inq.email}?subject=Re: Your Back2Me Luxury Brand Inquiry`}
                  style={{
                    display: 'inline-block',
                    background: 'var(--navy)', color: '#fff',
                    fontSize: '0.82rem', fontWeight: '600',
                    padding: '6px 16px', borderRadius: '6px',
                    textDecoration: 'none',
                  }}
                >
                  Reply via Email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
