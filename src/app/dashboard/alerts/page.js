'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AlertsPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // We only pull scans for tags that belong to the user.
    // Thanks to RLS on scan_events, querying all scans automatically
    // filters them down to only the ones belonging to the user's tags!
    const { data, error } = await supabase
      .from('scan_events')
      .select('*, tags(id, assigned_to, type, qr_code)')
      .order('created_at', { ascending: false });

    if (data) {
      setScans(data);
      // Mark all as read silently in the background
      const unreadIds = data.filter(s => !s.is_read).map(s => s.id);
      if (unreadIds.length > 0) {
        supabase.from('scan_events').update({ is_read: true }).in('id', unreadIds).then();
      }
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );
  }

  const typeIcons = {
    wristband: '⌚',
    pet_tag: '🐾',
    luggage_tag: '🧳',
    sticker: '📎',
  };

  return (
    <div className="dash-page">
      <h1 className="dash-page-title">Scan Alerts</h1>

      {scans.length === 0 ? (
        <div className="dash-empty-state">
          <span className="dash-empty-icon">🔔</span>
          <h3>No Scans Yet</h3>
          <p>When someone scans one of your tags, it will automatically appear here with their location and time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {scans.map(scan => (
            <div key={scan.id} style={{ display: 'flex', alignItems: 'center', background: scan.is_read ? '#fff' : '#fff8f5', border: '1px solid', borderColor: scan.is_read ? '#e8ecf1' : '#fcdabe', borderRadius: '16px', padding: '24px', gap: '20px' }}>
              <div style={{ fontSize: '2rem', width: '60px', height: '60px', background: scan.is_read ? '#f8f9fb' : '#fff1e6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                📡
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#1a2744' }}>
                  {scan.tags?.assigned_to} was scanned
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', color: '#555' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#aaa' }}>{typeIcons[scan.tags?.type]}</span> {scan.tags?.type.replace('_', ' ')} · {scan.tags?.qr_code}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📍</span> 
                    {scan.city ? `${scan.city}${scan.country ? `, ${scan.country}` : ''}` : (scan.latitude ? 'Location Pinpointed on Map' : '(Location hidden by finder)')}
                    {scan.latitude && <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: '4px' }}>[{parseFloat(scan.latitude).toFixed(4)}, {parseFloat(scan.longitude).toFixed(4)}]</span>}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⏰</span> {new Date(scan.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #e8ecf1', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '160px' }}>
                <Link href={`/dashboard/tags/${scan.tags?.id}/chat`} className="btn btn-orange" style={{ textAlign: 'center', padding: '10px' }}>
                  Open Chat
                </Link>
                {scan.latitude && (
                  <a 
                    href={`https://maps.google.com/?q=${scan.latitude},${scan.longitude}`} 
                    target="_blank" 
                    className="btn btn-outline" 
                    style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem' }}
                  >
                    View on Map
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
