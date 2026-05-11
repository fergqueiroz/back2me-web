'use client';

import { useState } from 'react';
import { generateQRTags } from '../actions';
import { QRCodeSVG } from 'qrcode.react';

export default function QRGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.target);
    const type = formData.get('type');
    const quantity = formData.get('quantity');

    const res = await generateQRTags(type, quantity);
    if (res.error) {
      setError(res.error);
    } else if (res.tags) {
      setTags(res.tags);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="admin-page qr-generator-page">
      <div className="admin-page-header no-print">
        <div>
          <h1 className="admin-page-title">Bulk QR Generator</h1>
          <p className="admin-page-subtitle">Generate unique, print-ready QR codes for your physical merchandise.</p>
        </div>
      </div>

      <div className="admin-card no-print" style={{ marginBottom: '32px' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>Merchandise Type</label>
            <select name="type" required style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}>
              <option value="wristband">Wristband</option>
              <option value="luggage_tag">Luggage Tag</option>
              <option value="pet_tag">Pet Tag</option>
              <option value="sticker">Sticker</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>Quantity (Max 500)</label>
            <input type="number" name="quantity" required min="1" max="500" defaultValue="10" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <button type="submit" disabled={loading} className="btn btn-navy" style={{ padding: '11px 24px' }}>
              {loading ? 'Generating...' : 'Generate Tags'}
            </button>
          </div>
        </form>
        {error && <p style={{ color: '#dc2626', marginTop: '16px', fontSize: '14px' }}>{error}</p>}
      </div>

      {tags.length > 0 && (
        <div className="qr-results-section">
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#111827' }}>Generated Tags ({tags.length})</h2>
            <button onClick={handlePrint} className="btn" style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px' }}>
              🖨️ Print / Save PDF
            </button>
          </div>

          <div className="qr-print-grid">
            {tags.map((tag) => (
              <div key={tag.id} className="qr-print-item">
                <QRCodeSVG 
                  value={`https://www.back2meglobal.com/scan/${tag.id}`} 
                  size={120}
                  level="Q"
                  includeMargin={true}
                />
                <div className="qr-print-details">
                  <strong>{tag.qr_code}</strong>
                  <span>{tag.type.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
