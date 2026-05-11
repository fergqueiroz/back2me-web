'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import './admin.css';

export default function AdminLayout({ children }) {
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    getProfile();
  }, []);

  const navItems = [
    { href: '/admin', label: 'Overview', icon: '📊' },
    { href: '/admin/marketing', label: 'Marketing', icon: '📈' },
    { href: '/admin/inventory', label: 'Merchandise (Stock)', icon: '🧮' },
    { href: '/admin/users', label: 'Customers', icon: '👥' },
    { href: '/admin/shipments', label: 'Shipments', icon: '📦' },
    { href: '/admin/billing', label: 'Billing', icon: '💳' },
    { href: '/admin/finance', label: 'Finance', icon: '💰' },
    { href: '/admin/tax', label: 'Tax', icon: '🧾' },
    { href: '/admin/tags', label: 'Registered Tags', icon: '🏷️' },
    { href: '/admin/qr-generator', label: 'QR Generator', icon: '🖨️' },
    { href: '/admin/chats', label: 'Active Chats', icon: '💬' },
    { href: '/admin/scans', label: 'Scan Feed', icon: '📡' },
    { href: '/admin/logs', label: 'Audit Logs', icon: '📋' },
    { href: '/admin/inquiries', label: 'Inquiries', icon: '📩' },
  ];

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-logo">
            <span className="admin-logo-mark">B2M</span>
            <span className="admin-logo-text">Admin</span>
          </Link>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">OPERATIONS</div>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </Link>
          ))}
          
          <div className="admin-nav-section" style={{ marginTop: '32px' }}>QUICK LINKS</div>
          <Link href="/dashboard" className="admin-nav-item">
            <span className="admin-nav-icon">←</span>
            <span className="admin-nav-label">Exit to Dashboard</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-user-info">
              <span className="admin-user-name">{profile?.name || 'Admin'}</span>
              <span className="admin-user-role">{profile?.role?.toUpperCase() || 'LOADING...'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <div className="admin-topbar-right">
            <span className="admin-topbar-badge">INTERNAL SYSTEM</span>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
