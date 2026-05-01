'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ChatWindow({ tagId, scanId, userRole, finderSessionId, ownerName }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('active');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showContactPrompt, setShowContactPrompt] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneInputStr, setPhoneInputStr] = useState('');
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const supabase = createClient();

  useEffect(() => {
    if (!tagId || !finderSessionId) return;
    
    // 1. Initialize or Load Chat Session Status
    const initSession = async () => {
      const { data } = await supabase
        .from('chat_sessions')
        .select('status')
        .eq('tag_id', tagId)
        .eq('finder_session_id', finderSessionId)
        .single();
      
      if (data) {
        setSessionStatus(data.status);
      } else if (userRole === 'finder') {
        // Create session
        try {
          await supabase.from('chat_sessions').insert({
            tag_id: tagId,
            finder_session_id: finderSessionId,
            status: 'active'
          });
        } catch (e) {
          // ignore unique constraint
        }
      }
    };
    initSession();

    // 2. Load initial messages
    let query = supabase.from('messages').select('*').eq('tag_id', tagId).order('created_at', { ascending: true });
    
    if (userRole === 'finder') {
      query = query.eq('finder_session_id', finderSessionId);
    } else if (userRole === 'owner' && finderSessionId) {
      query = query.eq('finder_session_id', finderSessionId);
    }
    
    query.then(({ data }) => {
      if (data) setMessages(data);
      setLoading(false);
      scrollToBottom();
    });

    // 3. Subscribe to realtime messages
    const channelName = userRole === 'owner' ? `chat:tag_${tagId}_f_${finderSessionId}` : `chat:finder_${finderSessionId}`;
    
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: userRole === 'finder' ? `finder_session_id=eq.${finderSessionId}` : `tag_id=eq.${tagId}`
      }, (payload) => {
        // If owner, ensure message matches current finder session
        if (userRole === 'owner' && payload.new.finder_session_id !== finderSessionId) return;

        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        scrollToBottom();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions',
        filter: `tag_id=eq.${tagId}`
      }, (payload) => {
        if (payload.new.finder_session_id === finderSessionId) {
          setSessionStatus(payload.new.status);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tagId, scanId, finderSessionId]);

  // Check if we should prompt the finder for contact info
  useEffect(() => {
    if (userRole === 'finder' && messages.some(m => m.sender_type === 'finder')) {
      const alreadyPrompted = localStorage.getItem(`b2m_contact_prompted_${tagId}`);
      if (!alreadyPrompted) {
        setShowContactPrompt(true);
      }
    }
  }, [messages, userRole, tagId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sessionStatus === 'closed') return;
    
    const textToSend = inputText.trim();
    setInputText('');
    await handleSendText(textToSend);
  };

  const handleSendText = async (textStr) => {
    const newMsg = {
      tag_id: tagId,
      scan_id: scanId || null,
      sender_type: userRole,
      finder_session_id: finderSessionId,
      type: 'text',
      content: { text: textStr }
    };

    // Optimistically add
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, { ...newMsg, id: tempId, created_at: new Date().toISOString() }]);
    scrollToBottom();

    // Send to DB
    const { data, error } = await supabase.from('messages').insert(newMsg).select().single();
    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } else {
      console.error('Failed to send:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) return;
    
    // Optimistic loading
    setUploadingMedia(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const newMsg = {
        tag_id: tagId,
        scan_id: scanId || null,
        sender_type: userRole,
        finder_session_id: finderSessionId,
        type: 'location',
        content: { lat: position.coords.latitude, lng: position.coords.longitude }
      };

      await supabase.from('messages').insert(newMsg);
      setUploadingMedia(false);
    }, (err) => {
      alert("Unable to retrieve location");
      setUploadingMedia(false);
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }

    setUploadingMedia(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tagId', tagId);
      formData.append('finderSessionId', finderSessionId);

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Now create message
      const newMsg = {
        tag_id: tagId,
        scan_id: scanId || null,
        sender_type: userRole,
        finder_session_id: finderSessionId,
        type: 'photo',
        content: { url: data.url }
      };

      await supabase.from('messages').insert(newMsg);
    } catch (err) {
      alert(err.message || 'Error uploading photo');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const closeConversation = async () => {
    await supabase.from('chat_sessions')
      .update({ status: 'closed' })
      .eq('tag_id', tagId)
      .eq('finder_session_id', finderSessionId);
    
    setSessionStatus('closed');
    setShowConfirmClose(false);
  };

  if (loading) return <div className="dash-loading"><div className="dash-spinner"/></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e8ecf1' }}>
      
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8ecf1', background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#1a2744' }}>
            {userRole === 'finder' ? `Chat with ${ownerName}` : 'Chat with Finder'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: sessionStatus === 'closed' ? '#888' : '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: sessionStatus === 'closed' ? '#888' : '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
            {sessionStatus === 'closed' ? 'Conversation Closed' : 'Secure Private Session'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {userRole === 'finder' && (
            <Link href={`/scan/${tagId}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Back to Profile
            </Link>
          )}
          {userRole === 'owner' && sessionStatus === 'active' && !showConfirmClose && (
            <button onClick={() => setShowConfirmClose(true)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fee2e2' }}>
              End Conversation
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8f9fb' }}>
        
        {/* Custom Confirmation Prompt for Owner */}
        {showConfirmClose && (
          <div style={{ padding: '20px', background: '#fff', border: '1px solid #fee2e2', borderRadius: '12px', marginBottom: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)' }}>
            <h4 style={{ color: '#b91c1c', margin: '0 0 8px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ End this conversation?
            </h4>
            <p style={{ color: '#555', margin: '0 0 16px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              By ending this conversation, this specific finder will not be able to reach you anymore. Are you sure you want to continue?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
              <button 
                onClick={closeConversation} 
                className="btn" 
                style={{ padding: '6px 16px', fontSize: '0.85rem', background: '#ef4444', color: '#fff', border: 'none' }}
              >
                Yes, end conversation
              </button>
              <button 
                onClick={() => setShowConfirmClose(false)} 
                className="btn btn-outline" 
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
              >
                No, cancel
              </button>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', margin: 'auto', fontSize: '0.9rem' }}>
            No messages yet. Send a message to start the conversation.
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_type === userRole;
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '4px', margin: isMe ? '0 4px 0 0' : '0 0 0 4px' }}>
                  {msg.sender_type === 'owner' ? ownerName : 'Finder'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{
                  maxWidth: '75%',
                  padding: msg.type === 'photo' ? '4px' : '12px 16px',
                  borderRadius: '16px',
                  lineHeight: 1.4,
                  fontSize: '0.95rem',
                  background: isMe ? (msg.type === 'photo' ? 'transparent' : 'var(--orange)') : (msg.type === 'photo' ? 'transparent' : '#fff'),
                  color: isMe ? '#fff' : '#1a2744',
                  border: msg.type === 'photo' ? 'none' : (isMe ? 'none' : '1px solid #e8ecf1'),
                  borderBottomRightRadius: isMe ? '4px' : '16px',
                  borderBottomLeftRadius: isMe ? '16px' : '4px',
                  boxShadow: msg.type === 'photo' ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  {msg.type === 'text' && msg.content?.text}
                  {msg.type === 'photo' && (
                    <img src={msg.content.url} alt="Shared Photo" style={{ width: '100%', borderRadius: '14px', border: '1px solid #e8ecf1', display: 'block', maxHeight: '300px', objectFit: 'cover' }} />
                  )}
                  {msg.type === 'location' && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${msg.content.lat},${msg.content.lng}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none', fontWeight: '500' }}>
                      📍 Ver Localização no Mapa
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Contact Prompt (Finder Only) */}
        {showContactPrompt && userRole === 'finder' && sessionStatus === 'active' && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s' }}>
            <span style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '8px' }}>🤖 System Bot · Just now</span>
            <div style={{
              background: '#ebfdf3', border: '1px solid #bbf7d0', padding: '16px',
              borderRadius: '16px', maxWidth: '85%', color: '#166534',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)', textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.9rem', lineHeight: 1.4 }}>
                <strong>Would you like to share your contact info?</strong><br/>
                In case you close this window, the owner can reach you directly.
              </p>
              
              {!showPhoneInput ? (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => setShowPhoneInput(true)} className="btn" style={{ background: '#16a34a', color: '#fff', fontSize: '0.8rem', padding: '6px 12px', flex: 1 }}>
                    Yes, share number
                  </button>
                  <button onClick={() => {
                    setShowContactPrompt(false);
                    localStorage.setItem(`b2m_contact_prompted_${tagId}`, 'true');
                  }} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px', flex: 1, borderColor: '#86efac', color: '#15803d', background: '#fff' }}>
                    Stay Anonymous
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <input type="tel" value={phoneInputStr} onChange={e => setPhoneInputStr(e.target.value)} placeholder="e.g. +1 234 567 890" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none' }} />
                  <button onClick={() => {
                    if(!phoneInputStr.trim()) return;
                    handleSendText(`📞 My Contact Number: ${phoneInputStr}`);
                    setShowContactPrompt(false);
                    localStorage.setItem(`b2m_contact_prompted_${tagId}`, 'true');
                  }} className="btn" style={{ background: '#16a34a', color: '#fff', fontSize: '0.8rem', padding: '6px 12px' }}>
                    Send to Owner
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finder Closure Message */}
        {userRole === 'finder' && sessionStatus === 'closed' && (
          <div style={{ 
            marginTop: '24px',
            textAlign: 'center', 
            background: '#ebfdf3', 
            border: '1px solid #bbf7d0',
            padding: '24px', 
            borderRadius: '16px',
            color: '#166534'
          }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>🤝 Obrigado por fazer parte da nossa rede de kindness.</h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Honrando a privacidade do nosso cliente, essa conversa foi concluída e finalizada.
            </p>
            <Link href="/" target="_blank" className="btn" style={{ background: '#16a34a', color: '#fff', padding: '8px 16px', fontSize: '0.9rem', display: 'inline-block' }}>
              Descubra a Back2Me
            </Link>
          </div>
        )}
      </div>

      {/* Input Area */}
      {sessionStatus === 'active' && (
        <div style={{ padding: '16px', borderTop: '1px solid #e8ecf1', background: '#fff' }}>
          
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} />

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline" style={{ padding: '0', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e8ecf1', background: '#f8f9fb' }} title="Send Photo">
              📷
            </button>

            <button type="button" onClick={handleSendLocation} className="btn btn-outline" style={{ padding: '0', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e8ecf1', background: '#f8f9fb' }} title="Share Location">
              📍
            </button>

            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={uploadingMedia ? "Sending..." : "Type your message..."}
                disabled={uploadingMedia}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: '1px solid #d0d5dd', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
            
            <button type="submit" disabled={!inputText.trim() || uploadingMedia} style={{
              background: inputText.trim() ? 'var(--navy)' : '#e8ecf1',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              padding: '0 24px',
              height: '46px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: inputText.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}>
              Send
            </button>
          </form>
        </div>
      )}
      
      {sessionStatus === 'closed' && userRole === 'owner' && (
        <div style={{ padding: '16px', borderTop: '1px solid #e8ecf1', background: '#f8f9fb', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
          🔒 You have ended this conversation.
        </div>
      )}

    </div>
  );
}
