'use client';

import { useState } from 'react';

export default function InquiryModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,25,47,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        zIndex: 1001,
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', color: '#6B7280', lineHeight: 1,
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
              Message sent!
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '24px' }}>
              We received your inquiry and will get back to you at <strong>{email}</strong> shortly.
            </p>
            <button onClick={onClose} className="btn btn-navy" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '6px' }}>
              Luxury Brand Inquiry
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '24px' }}>
              Tell us about your brand and we&apos;ll be in touch.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1px solid var(--border-gray)',
                    borderRadius: '8px', fontSize: '0.95rem',
                    outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Message
                </label>
                <textarea
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us about your brand, event, or partnership idea..."
                  rows={5}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1px solid var(--border-gray)',
                    borderRadius: '8px', fontSize: '0.95rem',
                    outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                />
              </div>

              {status === 'error' && (
                <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '12px' }}>
                  Something went wrong. Please try again or email us directly at support@back2meglobal.com.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn btn-navy"
                style={{ width: '100%', opacity: status === 'loading' ? 0.7 : 1, cursor: status === 'loading' ? 'wait' : 'pointer' }}
              >
                {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
