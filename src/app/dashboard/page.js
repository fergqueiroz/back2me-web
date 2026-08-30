'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [tags, setTags] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Load tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('activated_at', { ascending: false });

      // Load recent scans (last 10)
      const { data: scansData } = await supabase
        .from('scan_events')
        .select('*, tags(assigned_to, type, qr_code)')
        .in('tag_id', (tagsData || []).map(t => t.id))
        .order('created_at', { ascending: false })
        .limit(10);

      setProfile(profileData);
      setTags(tagsData || []);
      setRecentScans(scansData || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeTags = tags.filter(t => t.status === 'active');
  const unreadScans = recentScans.filter(s => !s.is_read);
  const tagLimit = profile?.tag_limit || 3;
  const planName = { starter: 'Starter Kit', plus: 'Combo Plus', elite: 'Elite 12' }[profile?.plan] || 'Starter Kit';

  const hardwareImages = {
    wristband: {
      navy: '/products/back2mebluewristband.jpg',
      orange: '/products/back2meorangewristband.jpg',
    },
    pet_tag: {
      navy: '/products/back2mebluepettag.jpg',
      orange: '/products/back2meorangepettag.jpg',
    },
    luggage_tag: {
      navy: '/products/back2mebluetag.jpg',
      orange: '/products/back2meorangetag.jpg',
    },
    sticker: {
      navy: '/products/back2mebluesticker.PNG',
      orange: '/products/back2meorangesticker.jpg',
    }
  };

  const timeSince = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page-title">Dashboard</h1>

      {/* Stat Cards */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon">🏷️</div>
          <div className="dash-stat-body">
            <span className="dash-stat-value">{activeTags.length}</span>
            <span className="dash-stat-label">Active Tags</span>
          </div>
          <span className="dash-stat-meta">{activeTags.length} of {tagLimit} slots</span>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">📡</div>
          <div className="dash-stat-body">
            <span className="dash-stat-value">{recentScans.length}</span>
            <span className="dash-stat-label">Total Scans</span>
          </div>
          {unreadScans.length > 0 && (
            <span className="dash-stat-badge">{unreadScans.length} new</span>
          )}
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">⭐</div>
          <div className="dash-stat-body">
            <span className="dash-stat-value">{planName}</span>
            <span className="dash-stat-label">Current Plan</span>
          </div>
          <span className={`dash-stat-status ${profile?.plan_status === 'active' ? 'active' : 'warning'}`}>
            {profile?.plan_status || 'incomplete'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-section">
        <h2 className="dash-section-title">Quick Actions</h2>
        <div className="dash-actions-grid">
          <Link href="/dashboard/tags/activate" className="dash-action-card">
            <span className="dash-action-icon">➕</span>
            <span className="dash-action-label">Activate Tag</span>
          </Link>
          <Link href="/dashboard/tags" className="dash-action-card">
            <span className="dash-action-icon">🏷️</span>
            <span className="dash-action-label">Manage Tags</span>
          </Link>
          <Link href="/dashboard/alerts" className="dash-action-card">
            <span className="dash-action-icon">🔔</span>
            <span className="dash-action-label">Scan Alerts</span>
          </Link>
          <Link href="/dashboard/subscription" className="dash-action-card">
            <span className="dash-action-icon">💳</span>
            <span className="dash-action-label">My Plan</span>
          </Link>
        </div>
      </div>

      {/* My Tags Grid */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">My Tags</h2>
          <Link href="/dashboard/tags" className="dash-section-link">View All →</Link>
        </div>

        {activeTags.length === 0 ? (
          <div className="dash-empty-state">
            <span className="dash-empty-icon">🏷️</span>
            <h3>No active tags yet</h3>
            <p>Activate your first QR tag to start protecting what matters most.</p>
            <Link href="/dashboard/tags/activate" className="btn btn-orange">
              Activate Your First Tag
            </Link>
          </div>
        ) : (
          <div className="dash-tags-grid">
            {activeTags.slice(0, 4).map(tag => (
              <Link key={tag.id} href={`/dashboard/tags/${tag.id}`} className="dash-tag-card">
                <div className="dash-tag-icon" style={{ overflow: 'hidden', padding: 0 }}>
                  <img 
                    src={tag.photo_url || hardwareImages[tag.type]?.[tag.color] || '/products/logo.png'} 
                    alt={tag.assigned_to} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div className="dash-tag-info">
                  <span className="dash-tag-name">{tag.assigned_to || 'Unnamed'}</span>
                  <span className="dash-tag-type">{tag.type.replace('_', ' ')} · {tag.color}</span>
                  <span className="dash-tag-qr">{tag.qr_code}</span>
                </div>
                <div className={`dash-tag-status ${tag.status === 'active' ? 'active' : 'inactive'}`}>● {tag.status === 'active' ? 'Active' : 'Inactive'}</div>
              </Link>
            ))}
            {activeTags.length < tagLimit && (
              <Link href="/dashboard/tags/activate" className="dash-tag-card dash-tag-add">
                <span className="dash-tag-add-icon">+</span>
                <span className="dash-tag-add-label">Activate Tag</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">Recent Activity</h2>
          {recentScans.length > 0 && (
            <Link href="/dashboard/alerts" className="dash-section-link">View All →</Link>
          )}
        </div>

        {recentScans.length === 0 ? (
          <div className="dash-empty-state small">
            <p>No scan activity yet. When someone scans one of your tags, it will appear here.</p>
          </div>
        ) : (
          <div className="dash-activity-list">
            {recentScans.slice(0, 5).map(scan => (
              <div key={scan.id} className={`dash-activity-item ${!scan.is_read ? 'unread' : ''}`}>
                <div className="dash-activity-icon">📡</div>
                <div className="dash-activity-body">
                  <span className="dash-activity-text">
                    <strong>{scan.tags?.assigned_to || 'Tag'}</strong> was scanned
                    {scan.city && ` in ${scan.city}`}
                    {scan.country && `, ${scan.country}`}
                  </span>
                  <span className="dash-activity-time">{timeSince(scan.created_at)}</span>
                </div>
                {!scan.is_read && <span className="dash-activity-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
