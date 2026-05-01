'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ChatWindow from '@/app/components/chat/ChatWindow';

export default function FinderChatPage() {
  const params = useParams();
  const [tag, setTag] = useState(null);
  const [finderSessionId, setFinderSessionId] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    let session = localStorage.getItem('b2m_finder_session');
    if (!session) {
      session = `finder_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('b2m_finder_session', session);
    }
    setFinderSessionId(session);

    supabase.from('tags').select('id, assigned_to, type, status, profiles(name)').eq('id', params.tagId).single().then(({ data }) => {
      setTag(data);
    });
  }, [params.tagId]);

  if (!tag || !finderSessionId) return <div className="scan-public-page"><div className="dash-spinner" style={{ margin: 'auto' }}/></div>;
  if (tag.status !== 'active') return <div className="scan-public-page">Tag inactive.</div>;

  const ownerName = tag.profiles?.name?.split(' ')[0] || 'The Owner';

  return (
    <div className="scan-public-page" style={{ padding: '0', height: '100vh' }}>
      <div className="scan-container" style={{ height: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
        <ChatWindow 
          tagId={tag.id} 
          scanId={null} // Finder chat binds to tag + session, scan_id is optional depending on flow
          userRole="finder" 
          finderSessionId={finderSessionId}
          ownerName={ownerName}
        />
      </div>
    </div>
  );
}
