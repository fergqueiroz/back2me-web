'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ChatWindow from '@/app/components/chat/ChatWindow';

export default function GlobalInboxPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadSessions();

    const channel = supabase.channel('global_inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
        loadSessions(); // Reload list on any session change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadSessions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch sessions intersecting with user's tags
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        id, tag_id, finder_session_id, status, updated_at,
        tags!inner(id, user_id, assigned_to, type)
      `)
      .eq('tags.user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  }

  const typeIcons = {
    wristband: '⌚',
    pet_tag: '🐾',
    luggage_tag: '🧳',
    sticker: '📎',
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading your inbox...</p>
      </div>
    );
  }

  return (
    <div className="dash-page" style={{ padding: '0', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="dash-section-header" style={{ padding: '24px 32px 0' }}>
        <h1 className="dash-page-title" style={{ margin: 0 }}>Global Inbox</h1>
      </div>

      <div style={{ display: 'flex', flex: 1, marginTop: '24px', borderTop: '1px solid #e8ecf1', overflow: 'hidden' }}>
        
        {/* Thread List Sidebar */}
        <div style={{ width: '350px', borderRight: '1px solid #e8ecf1', background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📭</span>
              <p>No active conversations across your tags.</p>
            </div>
          ) : (
            sessions.map(session => {
              const isSelected = activeSession?.id === session.id;
              const tag = session.tags;
              return (
                <div 
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid #e8ecf1', 
                    cursor: 'pointer',
                    background: isSelected ? '#f8f9fb' : '#fff',
                    borderLeft: isSelected ? '4px solid var(--orange)' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#1a2744', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {typeIcons[tag.type]} {tag.assigned_to || 'Unnamed Tag'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                      {new Date(session.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#555' }}>Finder: {session.finder_session_id.substring(0, 12)}...</span>
                    {session.status === 'closed' && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#e8ecf1', borderRadius: '4px', color: '#555' }}>Closed</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Active Chat Thread Area */}
        <div style={{ flex: 1, background: '#f8f9fb', position: 'relative' }}>
          {activeSession ? (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '24px' }}>
              <ChatWindow 
                key={activeSession.id} // Force re-mount on selection change
                tagId={activeSession.tag_id}
                scanId={null}
                userRole="owner"
                finderSessionId={activeSession.finder_session_id}
                ownerName="You"
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', flexDirection: 'column' }}>
              <span style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>💬</span>
              <p>Select a conversation from the left to start chatting.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
