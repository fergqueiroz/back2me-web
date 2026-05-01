'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ 
    name: '', email: '', 
    shipping_name: '', shipping_street: '', shipping_city: '', shipping_state: '', shipping_zip: '', shipping_country: 'US' 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile({ 
        name: data.name || '', 
        email: data.email || '',
        shipping_name: data.shipping_name || '',
        shipping_street: data.shipping_street || '',
        shipping_city: data.shipping_city || '',
        shipping_state: data.shipping_state || '',
        shipping_zip: data.shipping_zip || '',
        shipping_country: data.shipping_country || 'US'
      });
    }
    setLoading(false);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const { data: { user } } = await supabase.auth.getUser();
    
    // Update profile table
    const { error } = await supabase
      .from('profiles')
      .update({ 
        name: profile.name,
        shipping_name: profile.shipping_name,
        shipping_street: profile.shipping_street,
        shipping_city: profile.shipping_city,
        shipping_state: profile.shipping_state,
        shipping_zip: profile.shipping_zip,
        shipping_country: profile.shipping_country
      })
      .eq('id', user.id);

    if (!error) {
      setMsg('Profile updated successfully.');
    } else {
      setMsg('Error saving profile.');
    }
    setSaving(false);
  };

  const handleChange = (e) => setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));

  if (loading) return <div className="dash-loading"><div className="dash-spinner"/></div>;

  return (
    <div className="dash-page" style={{ maxWidth: '600px' }}>
      <h1 className="dash-page-title">My Profile</h1>
      
      <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e8ecf1' }}>
        {msg && (
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
            {msg}
          </div>
        )}
        
        <form onSubmit={handleSave} className="login-form">
          <h3 className="dash-section-title" style={{ marginTop: 0, fontSize: '1.2rem' }}>Personal Info</h3>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={profile.name} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={profile.email} disabled style={{ background: '#f8f9fb', cursor: 'not-allowed', color: '#888' }} />
            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px' }}>Your email is tied to Stripe and cannot be changed here.</p>
          </div>

          <h3 className="dash-section-title" style={{ marginTop: '32px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📦 Shipping & Returns Address
          </h3>
          <div style={{ background: '#fff1e6', border: '1px solid #fcdabe', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.85rem', color: '#8c4a16' }}>
            <strong>Privacy Notice:</strong> If a finder requests to mail your item back, the system will use this address to securely calculate shipping rates. However, <strong>this address will eventually be printed on the shipping label given to the finder</strong>. If you require anonymity, please use a P.O. Box, workplace, or trusted alternate receiving location.
          </div>

          <div className="form-group">
            <label>Recipient Name</label>
            <input type="text" name="shipping_name" value={profile.shipping_name} onChange={handleChange} placeholder="e.g. John Doe / Mailbox #99" />
          </div>

          <div className="form-group">
            <label>Street Address</label>
            <input type="text" name="shipping_street" value={profile.shipping_street} onChange={handleChange} placeholder="123 Main St" />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>City</label>
              <input type="text" name="shipping_city" value={profile.shipping_city} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ width: '80px' }}>
              <label>State</label>
              <input type="text" name="shipping_state" value={profile.shipping_state} onChange={handleChange} placeholder="NY" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Zip Code</label>
              <input type="text" name="shipping_zip" value={profile.shipping_zip} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Country</label>
              <input type="text" name="shipping_country" value={profile.shipping_country} onChange={handleChange} />
            </div>
          </div>
          
          <button type="submit" className="btn btn-navy" disabled={saving} style={{ marginTop: '24px', alignSelf: 'flex-start', width: '100%' }}>
            {saving ? 'Saving...' : 'Save Profile Details'}
          </button>
        </form>
      </div>
    </div>
  );
}
