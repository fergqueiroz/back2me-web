'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import QRScanner from './QRScanner';

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(true);
  
  const [formData, setFormData] = useState({
    qrCode: '',
    assignedTo: '',
    category: 'other',
    ownerMessage: '',
    medicalInfo: '',
    phone: ''
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // Check URL query parameters for pre-scanned QR code or Tag ID
  useEffect(() => {
    const codeFromUrl = searchParams.get('code') || searchParams.get('qrCode') || searchParams.get('qr_code') || searchParams.get('id');
    if (codeFromUrl) {
      handleLookupOrSetCode(codeFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchPhone() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
        if (data?.phone) {
          setFormData(prev => ({ ...prev, phone: data.phone }));
        }
      }
    }
    fetchPhone();
  }, []);

  const handleLookupOrSetCode = async (rawCode) => {
    let cleanCode = rawCode.trim();
    if (cleanCode.includes('/scan/')) {
      cleanCode = cleanCode.split('/scan/').pop().split('/')[0];
    }
    
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);
    if (isUuid) {
      const { data } = await supabase.from('tags').select('qr_code').eq('id', cleanCode).single();
      if (data?.qr_code) {
        setFormData(prev => ({ ...prev, qrCode: data.qr_code }));
        setShowScanner(false);
        setError('');
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, qrCode: cleanCode.toUpperCase() }));
    setShowScanner(false);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleScan = async (decodedText) => {
    handleLookupOrSetCode(decodedText);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!formData.qrCode) {
      setError('Por favor, escaneie a sua tag física antes de prosseguir.');
      return;
    }

    setLoading(true);
    setError('');

    let cleanedPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    
    if (!cleanedPhone.startsWith('+')) {
      setError('Please include your country code starting with + (e.g., +5511999999999 for Brazil or +1 for US)');
      setLoading(false);
      return;
    }
    
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      setError('Phone number is invalid. Example format: +5511999999999');
      setLoading(false);
      return;
    }
    
    const submitData = { ...formData, phone: cleanedPhone };

    try {
      let uploadedPhotoUrl = null;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tag-photos')
          .upload(filePath, photoFile);

        if (uploadError) {
          throw new Error('Failed to upload photo: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('tag-photos')
          .getPublicUrl(filePath);

        uploadedPhotoUrl = publicUrlData.publicUrl;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileErr } = await supabase.from('profiles').update({ phone: submitData.phone }).eq('id', user.id);
        if (profileErr) throw new Error('Failed to save phone number: ' + profileErr.message);
      }

      const res = await fetch('/api/tags/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submitData, photoUrl: uploadedPhotoUrl })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to activate tag');

      router.push(`/dashboard/tags/success?id=${data.tag.id}&name=${encodeURIComponent(data.tag.assigned_to)}`);

    } catch (err) {
      setError(err.message);
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="dash-page-title">Activate New Tag</h1>
      
      <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e8ecf1' }}>
        <p style={{ color: '#555', marginBottom: '24px', lineHeight: 1.6 }}>
          Escaneie o código QR da sua tag física Back2Me utilizando a câmera do seu celular ou computador.
        </p>

        {error && (
          <div className="login-error" style={{ marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleActivate} className="login-form">
          {/* CAMERA SCANNER AREA (NO MANUAL TEXT FIELD) */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1a2744' }}>
              Reconhecimento da Tag Física *
            </label>

            {formData.qrCode ? (
              <div style={{ background: '#ecfdf5', border: '2px solid #10b981', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>✅</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tag Escaneada com Sucesso</div>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: '800', color: '#065f46' }}>{formData.qrCode}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFormData(prev => ({ ...prev, qrCode: '' })); setShowScanner(true); }}
                  className="btn btn-outline"
                  style={{ padding: '8px 14px', fontSize: '0.85rem', borderColor: '#10b981', color: '#047857' }}
                >
                  📷 Escanear Outra Tag
                </button>
              </div>
            ) : (
              <div>
                {showScanner ? (
                  <QRScanner 
                    onScan={handleScan} 
                    onError={(err) => console.warn('QR scan warning:', err)} 
                    onClose={() => setShowScanner(false)} 
                  />
                ) : (
                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '2px dashed #cbd5e1', textAlign: 'center' }}>
                    <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: '0.95rem' }}>Nenhuma tag escaneada ainda.</p>
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="btn btn-orange"
                      style={{ padding: '10px 20px', fontSize: '0.95rem' }}
                    >
                      📷 Abrir Câmera para Escanear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Owner Phone Number (For Voice Calls) *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="e.g. +16063320861"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#888' }}>
              Finders can call you, but your number stays private.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
            <div className="form-group">
              <label>Tag Photo (Optional)</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '80px', height: '80px', borderRadius: '16px', background: '#f8f9fb', 
                    border: '1px dashed #d0d5dd', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', flexShrink: 0
                  }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.5rem', color: '#aaa' }}>📷</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: '6px' }}>
                    Choose Photo
                  </button>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>JPEG, PNG up to 5MB. Highly recommended for kids and pets.</p>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoSelect} style={{ display: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="assignedTo">Who or what is this for? *</label>
                <input
                  type="text"
                  id="assignedTo"
                  name="assignedTo"
                  placeholder="e.g., Lucas, Max (Dog), Work Bag"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #d0d5dd', borderRadius: '10px', fontSize: '0.95rem', appearance: 'none', background: '#fff' }}
                >
                  <option value="child">Child / Loved One</option>
                  <option value="pet">Pet</option>
                  <option value="luggage">Luggage / Bag</option>
                  <option value="equipment">Equipment / Gear</option>
                  <option value="personal">Personal Item</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e8ecf1', margin: '20px 0' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px', color: '#1a2744' }}>Public Information</h3>
          <p style={{ fontSize: '0.82rem', color: '#888', margin: '-10px 0 20px' }}>
            This information will be visible to whoever scans the tag.
          </p>

          <div className="form-group">
            <label htmlFor="ownerMessage">Message to the Finder (Optional)</label>
            <textarea
              id="ownerMessage"
              name="ownerMessage"
              placeholder="e.g., This is my son Lucas. He has autism and is non-verbal. Please keep him safe and call me immediately."
              rows={4}
              value={formData.ownerMessage}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #d0d5dd', borderRadius: '10px', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="medicalInfo">Medical / Vital Info (Optional)</label>
            <textarea
              id="medicalInfo"
              name="medicalInfo"
              placeholder="e.g., Allergic to peanuts. Needs insulin."
              rows={2}
              value={formData.medicalInfo}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #d0d5dd', borderRadius: '10px', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-orange" 
              disabled={loading || !formData.qrCode} 
              style={{ minWidth: '160px', opacity: !formData.qrCode ? 0.6 : 1 }}
            >
              {loading ? 'Activating...' : 'Activate Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ActivateTagPage() {
  return (
    <Suspense fallback={<div className="dash-loading"><div className="dash-spinner" /></div>}>
      <ActivateForm />
    </Suspense>
  );
}
