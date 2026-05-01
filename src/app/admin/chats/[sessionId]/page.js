import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminChatDetailPage({ params }) {
  const { sessionId } = await params;
  const supabase = createAdminClient();

  // 1. Fetch the session details
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select(`
      *,
      tag:tags(id, qr_code, assigned_to, type, owner:profiles(id, name, email, phone))
    `)
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <h2 style={{ color: '#dc2626' }}>Chat Session Not Found</h2>
          <p>Error: {sessionError?.message}</p>
          <Link href="/admin/chats" style={{ color: '#4b5563' }}>← Back to Chats</Link>
        </div>
      </div>
    );
  }

  // 2. Fetch the messages
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('tag_id', session.tag_id)
    .eq('finder_session_id', session.finder_session_id)
    .order('created_at', { ascending: true });

  const ownerName = session.tag?.owner?.name || 'Owner';

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <Link href="/admin/chats" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>
          ← Back to Chats
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="admin-page-title">Chat Audit Log</h1>
            <p className="admin-page-subtitle">Session ID: {session.id} • Started {new Date(session.created_at).toLocaleString()}</p>
          </div>
          <div>
            <span style={{ 
              padding: '6px 14px', 
              borderRadius: '16px', 
              fontSize: '13px', 
              fontWeight: '800',
              backgroundColor: session.status === 'active' ? '#d1fae5' : '#f3f4f6',
              color: session.status === 'active' ? '#065f46' : '#4b5563',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {session.status}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
        
        {/* Left Column: Chat Transcript */}
        <div className="admin-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '14px', fontWeight: '600', color: '#374151', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
            Conversation Transcript
          </div>
          
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff' }}>
            {!messages || messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '32px' }}>No messages recorded yet.</div>
            ) : (
              messages.map(msg => {
                const isSystem = msg.is_system;
                const isOwner = msg.sender_type === 'owner';
                
                if (isSystem) {
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                      <div style={{ background: '#f3f4f6', padding: '8px 16px', borderRadius: '16px', fontSize: '12px', color: '#4b5563', textAlign: 'center', maxWidth: '80%' }}>
                        <strong>System Notice:</strong> {typeof msg.content === 'object' ? msg.content.text : msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwner ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', marginLeft: '4px', marginRight: '4px' }}>
                      {isOwner ? `${ownerName} (Owner)` : 'Finder'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    {msg.type === 'location' ? (
                      <div style={{ background: isOwner ? '#e0e7ff' : '#f3f4f6', padding: '12px 16px', borderRadius: '12px', border: isOwner ? '1px solid #c7d2fe' : '1px solid #e5e7eb', fontSize: '14px', color: '#111827', maxWidth: '80%' }}>
                        📍 Shared Location
                        <div style={{ fontSize: '12px', marginTop: '4px', color: '#4b5563' }}>
                          Lat: {msg.content.lat}, Lng: {msg.content.lng}
                        </div>
                      </div>
                    ) : msg.type === 'photo' ? (
                      <div style={{ background: isOwner ? '#e0e7ff' : '#f3f4f6', padding: '8px', borderRadius: '12px', border: isOwner ? '1px solid #c7d2fe' : '1px solid #e5e7eb', maxWidth: '80%' }}>
                        <img src={msg.content} alt="Upload" style={{ height: 'auto', maxWidth: '200px', borderRadius: '8px', display: 'block' }} />
                        {msg.content?.text && <div style={{ padding: '8px', fontSize: '14px' }}>{msg.content.text}</div>}
                      </div>
                    ) : (
                      <div style={{ background: isOwner ? '#e0e7ff' : '#f3f4f6', padding: '12px 16px', borderRadius: '12px', border: isOwner ? '1px solid #c7d2fe' : '1px solid #e5e7eb', fontSize: '14px', color: '#111827', maxWidth: '80%', whiteSpace: 'pre-wrap' }}>
                        {typeof msg.content === 'object' ? msg.content.text : msg.content}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Context & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="admin-card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Incident Context</h2>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Involved Asset</div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
                  <Link href={`/admin/tags?search=${session.tag?.qr_code}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                    {session.tag?.assigned_to || 'Unnamed'} ({session.tag?.qr_code}) ↗
                  </Link>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', textTransform: 'capitalize' }}>Type: {session.tag?.type?.replace('_', ' ')}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Owner Details</div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
                  <Link href={`/admin/users/${session.tag?.owner?.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                    {ownerName} ↗
                  </Link>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{session.tag?.owner?.email}</div>
                {session.tag?.owner?.phone && <div style={{ fontSize: '13px', color: '#6b7280' }}>{session.tag.owner.phone}</div>}
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Finder Anonymity ID</div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#4b5563', marginTop: '4px', wordBreak: 'break-all' }}>
                  {session.finder_session_id}
                </div>
              </div>

            </div>
          </div>

          <div className="admin-card" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, color: '#9b2c2c' }}>Moderator Actions</h2>
            <p style={{ fontSize: '13px', color: '#742a2a', marginTop: '8px' }}>
              If a conversation violates terms or needs to be halted to protect a user, you can forcefully close the session.
            </p>
            <button 
              disabled={session.status === 'closed'}
              style={{ 
                marginTop: '16px', 
                padding: '10px 16px', 
                background: session.status === 'closed' ? '#fca5a5' : '#dc2626', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: session.status === 'closed' ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                width: '100%'
              }}
            >
              {session.status === 'closed' ? 'Session Already Closed' : 'Force Close Chat Session'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
