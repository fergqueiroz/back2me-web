'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import './dashboard.css';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/tags', label: 'My Tags', icon: '🏷️' },
    { href: '/dashboard/alerts', label: 'Scan Alerts', icon: '🔔' },
    { href: '/dashboard/chat', label: 'Inbox (Chats)', icon: '💬' },
    { href: '/dashboard/subscription', label: 'My Plan', icon: '💳' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="dash-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-header">
          <Link href="/" className="dash-logo">
            <span className="dash-logo-orange">Back2Me</span>
            <span className="dash-logo-navy">GLOBAL</span>
          </Link>
          <button className="dash-sidebar-close" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="dash-nav">
          <Link href="/" className="dash-nav-item" style={{ marginBottom: '16px', background: '#f8f9fb', border: '1px solid #e8ecf1' }}>
            <span className="dash-nav-icon">←</span>
            <span className="dash-nav-label">Back to Main Site</span>
          </Link>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`dash-nav-item ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              <span className="dash-nav-label">{item.label}</span>
            </Link>
          ))}
          {profile && ['admin', 'support'].includes(profile.role) && (
            <Link
              href="/admin"
              className="dash-nav-item"
              style={{ marginTop: '16px', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', fontWeight: 'bold' }}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="dash-nav-icon">🛡️</span>
              <span className="dash-nav-label">Admin Panel</span>
            </Link>
          )}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-card">
            <div className="dash-user-avatar">
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="dash-user-info">
              <span className="dash-user-name">{profile?.name || 'Loading...'}</span>
              <span className="dash-user-plan">{profile?.plan || 'starter'} plan</span>
            </div>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        <header className="dash-topbar">
          <button className="dash-menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <div className="dash-topbar-right">
            <span className="dash-greeting">
              {profile?.name ? `Welcome, ${profile.name.split(' ')[0]}` : ''}
            </span>
          </div>
        </header>
        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  );
}
