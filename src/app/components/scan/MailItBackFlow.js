'use client';

import { useState } from 'react';

const PARCEL_OPTIONS = [
  { key: 'envelope', label: 'Envelope / Flat', desc: 'Keys, cards, documents', icon: '✉️' },
  { key: 'small',    label: 'Small Package',   desc: 'Phone, wallet, AirPods', icon: '📦' },
  { key: 'medium',   label: 'Medium Package',  desc: 'Laptop, handbag, camera', icon: '📫' },
  { key: 'large',    label: 'Large Package',   desc: 'Backpack, luggage, gear', icon: '🧳' },
];

export default function MailItBackFlow({ tagId, chatSessionId, onCancel }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parcelSize, setParcelSize] = useState('small');
  
  const [address, setAddress] = useState({
    name: '',
    street1: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const handleChange = (e) => setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/shipping/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          chatSessionId,
          finderAddress: address,
          parcelSize
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      setStep(3); // Success
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──
  if (step === 3) {
    return (
      <div style={{ background: '#f8f9fb', borderRadius: '16px', padding: '24px', border: '1px solid #e8ecf1', marginTop: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📬</span>
          <h3 style={{ margin: '0 0 12px', color: '#1a2744' }}>Request Sent!</h3>
          <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
            We've alerted the owner. Once they securely pre-pay the shipping fee, a <strong>Printable Shipping Label</strong> will be delivered right into your Chat Window above!
          </p>
          <button onClick={onCancel} className="btn btn-outline" style={{ marginTop: '20px', width: '100%' }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fb', borderRadius: '16px', padding: '24px', border: '1px solid #e8ecf1', marginTop: '16px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#1a2744', display: 'flex', justifyContent: 'space-between' }}>
        Mail it Back (Prepaid)
        <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', opacity: 0.5 }}>×</button>
      </h3>

      {/* ── Step 1: Parcel Size ── */}
      {step === 1 && (
        <>
          <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '16px' }}>
            What best describes the item you found?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PARCEL_OPTIONS.map(opt => (
              <label key={opt.key} onClick={() => setParcelSize(opt.key)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: '2px solid', borderColor: parcelSize === opt.key ? '#1a2744' : '#e8ecf1', borderRadius: '12px', cursor: 'pointer', background: parcelSize === opt.key ? '#f0f4ff' : '#fff', transition: 'all 0.15s ease' }}>
                <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1a2744' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{opt.desc}</div>
                </div>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${parcelSize === opt.key ? '#1a2744' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {parcelSize === opt.key && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1a2744' }} />}
                </div>
              </label>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="btn btn-navy" style={{ width: '100%', marginTop: '16px' }}>
            Continue
          </button>
        </>
      )}

      {/* ── Step 2: Address ── */}
      {step === 2 && (
        <>
          <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '16px' }}>
            Enter the address you'll ship from. The owner will pre-pay the fee. You'll receive a printable label here.
          </p>

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" name="name" placeholder="Your Name or Alias" value={address.name} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} />
            <input type="text" name="street1" placeholder="Street Address" value={address.street1} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" name="city" placeholder="City" value={address.city} onChange={handleChange} required style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} />
              <input type="text" name="state" placeholder="State" value={address.state} onChange={handleChange} required style={{ width: '70px', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} />
            </div>
            <input type="text" name="zip" placeholder="Zip Code" value={address.zip} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1 }}>Back</button>
              <button type="submit" disabled={loading} className="btn btn-navy" style={{ flex: 2 }}>
                {loading ? 'Submitting...' : 'Submit to Owner'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
