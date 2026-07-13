'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SubscriptionPage() {
  const [profile, setProfile] = useState(null);
  const [tagsCount, setTagsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, tagsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tags').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active')
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (tagsRes.count !== null) setTagsCount(tagsRes.count);
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
        setPortalLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while opening billing portal');
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );
  }

  const tagLimit = profile?.tag_limit || 3;
  const plans = {
    starter: { name: 'Starter Kit', limit: 3, price: '$4.90', features: ['Global Recovery Network', 'Secure Private Chat', 'Scan Alerts'] },
    plus: { name: 'Combo Plus', limit: 6, price: '$6.90', features: ['Global Recovery Network', 'Secure Private Chat', 'Scan Alerts', 'Priority Support'] },
    elite: { name: 'Elite 12', limit: 12, price: '$9.90', features: ['Global Recovery Network', 'Secure Private Chat', 'Scan Alerts', 'Priority Support', 'VIP Recovery'] }
  };

  const currentPlan = plans[profile?.plan] || plans.starter;

  return (
    <div className="dash-page">
      <h1 className="dash-page-title">My Plan & Billing</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '32px' }}>
        
        {/* Left Col: Current Plan Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #e8ecf1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: '#1a2744', margin: '0 0 8px' }}>{currentPlan.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--orange)' }}>{currentPlan.price}</span>
                  <span style={{ color: '#888', fontSize: '0.9rem' }}>per month</span>
                </div>
              </div>
              <span className={`dash-stat-status ${profile?.plan_status === 'active' ? 'active' : 'warning'}`} style={{ position: 'static' }}>
                {profile?.plan_status || 'incomplete'}
              </span>
            </div>

            <div style={{ background: '#f8f9fb', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#1a2744' }}>Tags Protected</span>
                <span style={{ fontWeight: '600', color: '#1a2744' }}>{tagsCount} / {tagLimit}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e8ecf1', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, (tagsCount / tagLimit) * 100)}%`, 
                    height: '100%', 
                    background: 'var(--orange)',
                    borderRadius: '4px'
                  }} 
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#888', margin: '12px 0 0' }}>
                You have {tagLimit - tagsCount} unused tags available on your current plan.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #e8ecf1', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1rem', color: '#1a2744', marginBottom: '16px' }}>Plan Features Included</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentPlan.features.map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '0.9rem' }}>
                    <span style={{ color: '#16a34a' }}>✓</span> {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #e8ecf1' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#1a2744', margin: '0 0 16px' }}>Billing Management</h2>
            <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Update your payment method, view past invoices, or change your subscription plan securely through Stripe Billing Portal.
            </p>
            
            <button 
              onClick={handleManageBilling} 
              disabled={portalLoading || !profile?.stripe_customer_id}
              className="btn btn-navy" 
              style={{ width: '100%', maxWidth: '250px' }}
            >
              {portalLoading ? 'Redirecting...' : 'Manage Billing & Plan'}
            </button>
            {!profile?.stripe_customer_id && (
              <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '12px' }}>
                No billing account associated. If you just purchased, the system is still syncing.
              </p>
            )}
          </div>
          
        </div>

        {/* Right Col: FAQ */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e8ecf1', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1a2744', margin: '0 0 20px' }}>Frequent Questions</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#333', margin: '0 0 8px' }}>How do I upgrade my plan?</h4>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0, lineHeight: 1.5 }}>
              Click "Manage Billing & Plan" above to open the Stripe portal. There you can select a new plan and checkout securely.
            </p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#333', margin: '0 0 8px' }}>What happens if I cancel?</h4>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0, lineHeight: 1.5 }}>
              Your tags will remain active until the end of your billing cycle. After that, they will become inactive and will no longer show your profile to finders.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#333', margin: '0 0 8px' }}>Can I buy more tags?</h4>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0, lineHeight: 1.5 }}>
               Yes! You can order additional hardware from our store and link them to your existing subscription limits.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
