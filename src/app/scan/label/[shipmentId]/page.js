'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ShippingQRPage() {
  const params = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('qr'); // 'qr' | 'pdf'

  useEffect(() => {
    fetchShipment();
  }, []);

  async function fetchShipment() {
    try {
      const res = await fetch(`/api/shipping/label/${params.shipmentId}`);
      const data = await res.json();
      if (res.ok) setShipment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e8ecf1', borderTopColor: '#1a2744', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b' }}>Loading label...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
        <p style={{ color: '#dc2626' }}>Label not found or not yet generated.</p>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shipment.tracking_code)}&margin=10`;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#1a2744', margin: '0 0 8px' }}>📦 Your Shipping Label</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
          Show this at a <strong>{shipment.carrier || 'carrier'}</strong> drop-off location
        </p>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: '4px', background: '#e8ecf1', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
        <button onClick={() => setViewMode('qr')} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', background: viewMode === 'qr' ? '#fff' : 'transparent', color: viewMode === 'qr' ? '#1a2744' : '#94a3b8', boxShadow: viewMode === 'qr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s ease' }}>
          📱 QR Code
        </button>
        <button onClick={() => setViewMode('pdf')} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', background: viewMode === 'pdf' ? '#fff' : 'transparent', color: viewMode === 'pdf' ? '#1a2744' : '#94a3b8', boxShadow: viewMode === 'pdf' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s ease' }}>
          🖨️ Print Label
        </button>
      </div>

      {/* QR View */}
      {viewMode === 'qr' && (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <img 
            src={qrUrl} 
            alt="Shipping QR Code" 
            style={{ width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '8px' }} 
          />
          <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '1.1rem', color: '#047857', letterSpacing: '0.1em' }}>
              {shipment.tracking_code}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#065f46' }}>Tracking Number</p>
          </div>
          <p style={{ marginTop: '16px', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
            Show this QR code to the staff at any <strong>{shipment.carrier}</strong> location. No printer needed!
          </p>
        </div>
      )}

      {/* PDF View */}
      {viewMode === 'pdf' && (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🖨️</span>
          <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '20px' }}>
            Download and print the shipping label PDF. Tape it to your package.
          </p>
          <a href={shipment.label_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '14px', background: '#1a2744', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '1rem' }}>
            Download Label PDF
          </a>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fb', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Tracking: <strong>{shipment.tracking_code}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
