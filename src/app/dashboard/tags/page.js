'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shippingSuccess, setShippingSuccess] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
    if (searchParams.get('shipping_success') === 'true') {
      setShippingSuccess(true);
      // Auto-dismiss after 8 seconds
      setTimeout(() => setShippingSuccess(false), 8000);
    }
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [tagsRes, profileRes] = await Promise.all([
      supabase.from('tags').select('*').eq('user_id', user.id).order('activated_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).single()
    ]);

    if (tagsRes.data) setTags(tagsRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  }

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

  const activeCount = tags.filter(t => t.status === 'active').length;
  const tagLimit = profile?.tag_limit || 3;

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading your tags...</p>
      </div>
    );
  }

  return (
    <div className="dash-page">
      {/* ── Shipping Payment Success Banner ── */}
      {shippingSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#047857' }}>Payment successful!</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#065f46' }}>Your shipping label is being generated. It will appear here and in the Finder's chat shortly.</p>
            </div>
          </div>
          <button onClick={() => setShippingSuccess(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#047857' }}>✕</button>
        </div>
      )}

      <div className="dash-section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="dash-page-title" style={{ marginBottom: '8px' }}>My Tags</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
            {activeCount} of {tagLimit} slots used ({profile?.plan || 'starter'} plan)
          </p>
        </div>
        {activeCount < tagLimit && (
          <Link href="/dashboard/tags/activate" className="btn btn-orange">
            + Activate New Tag
          </Link>
        )}
      </div>

      {tags.length === 0 ? (
        <div className="dash-empty-state">
          <span className="dash-empty-icon">🏷️</span>
          <h3>No tags activated yet</h3>
          <p>Activate your first QR tag to start protecting your belongings or loved ones.</p>
          <Link href="/dashboard/tags/activate" className="btn btn-orange">
            Activate Your First Tag
          </Link>
        </div>
      ) : (
        <div className="dash-tags-grid">
          {tags.map(tag => (
            <Link key={tag.id} href={`/dashboard/tags/${tag.id}`} className="dash-tag-card" style={{ padding: '24px', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                <div className="dash-tag-icon" style={{ overflow: 'hidden', padding: 0 }}>
                  <img 
                    src={tag.photo_url || hardwareImages[tag.type]?.[tag.color] || '/products/logo.png'} 
                    alt={tag.assigned_to} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div className={`dash-stat-status ${tag.status === 'active' ? 'active' : 'warning'}`} style={{ position: 'relative', top: 0, right: 0 }}>
                  {tag.status}
                </div>
              </div>
              
              <div className="dash-tag-info" style={{ width: '100%' }}>
                <span className="dash-tag-name" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                  {tag.assigned_to || 'Unnamed Tag'}
                </span>
                <span className="dash-tag-type" style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
                  {tag.type.replace('_', ' ')} · {tag.color}
                </span>
                
                <div style={{ background: '#f8f9fb', padding: '10px 12px', borderRadius: '8px', marginTop: '16px', border: '1px solid #e8ecf1' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>QR CODE ID</span>
                  <span className="dash-tag-qr" style={{ fontSize: '1rem', color: '#1a2744', fontWeight: '500' }}>{tag.qr_code}</span>
                </div>
              </div>
            </Link>
          ))}
          
          {activeCount < tagLimit && (
            <Link href="/dashboard/tags/activate" className="dash-tag-card dash-tag-add" style={{ minHeight: '220px' }}>
              <span className="dash-tag-add-icon">+</span>
              <span className="dash-tag-add-label">Activate Tag</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
