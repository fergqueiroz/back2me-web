'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'magiclink'
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'magiclink') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setSuccessMsg('Check your inbox! We sent a magic link to sign you in.');
        
      } else if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        setSuccessMsg('Registration successful! Check your email to confirm your account.');
        
      } else if (mode === 'signin') {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Link marketing session conversion
        const mCookie = document.cookie.split('; ').find(row => row.startsWith('b2m_session='));
        if (mCookie && data?.user) {
          const sessionToken = mCookie.split('=')[1];
          await supabase.from('marketing_sessions')
            .update({ converted_user_id: data.user.id })
            .eq('session_token', sessionToken)
            .is('converted_user_id', null);
        }

        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px',
      fontFamily: '"Inter", sans-serif',
      backgroundImage: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '48px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.2) inset',
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '16px' }}>
            <span style={{ color: '#ea580c', fontWeight: '800', fontSize: '20px' }}>Back2Me</span>
            <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '20px' }}>GLOBAL</span>
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
            {mode === 'signup' ? 'Create your Account' : mode === 'magiclink' ? 'Sign In Instantly' : 'Welcome Back'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {mode === 'signup' ? 'Start protecting your assets globally.' : 'Sign in to manage your tags and settings.'}
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== 'magiclink' && (
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
            <button 
              onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
              style={{ flex: 1, padding: '8px', fontSize: '13px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: mode === 'signin' ? '#fff' : 'transparent', color: mode === 'signin' ? '#0f172a' : '#64748b', boxShadow: mode === 'signin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
              style={{ flex: 1, padding: '8px', fontSize: '13px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: mode === 'signup' ? '#fff' : 'transparent', color: mode === 'signup' ? '#0f172a' : '#64748b', boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', fontSize: '13px', marginBottom: '20px', borderRadius: '4px' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '14px', marginBottom: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✉️</div>
            {successMsg}
          </div>
        )}

        {/* Form */}
        {!successMsg && (
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#ea580c'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            {mode !== 'magiclink' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>Password</label>
                  {mode === 'signin' && (
                    <Link href="/reset-password" style={{ fontSize: '12px', color: '#ea580c', textDecoration: 'none', fontWeight: '500' }}>
                      Forgot Password?
                    </Link>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#ea580c'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                backgroundColor: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.8 : 1,
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
            </button>
          </form>
        )}

        {/* Separator / Toggles */}
        {!successMsg && (
          <div style={{ marginTop: '32px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: '100%', borderTop: '1px solid #e2e8f0' }}></div>
              <span style={{ backgroundColor: '#fff', padding: '0 12px', fontSize: '12px', color: '#94a3b8', zIndex: 1 }}>OR</span>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mode !== 'magiclink' ? (
                <button 
                  type="button"
                  onClick={() => { setMode('magiclink'); setError(''); setSuccessMsg(''); }}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>✨</span> Sign in with Magic Link
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>🔑</span> Sign in with Password
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          By continuing, you agree to Back2Me's Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
