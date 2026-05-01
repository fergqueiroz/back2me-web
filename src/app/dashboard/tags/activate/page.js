'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ActivateTagPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  // Inside component, just below state definitions
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    setLoading(true);
    setError('');

    // E.164 Phone format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone number must be in E.164 international format (e.g., +16063320861)');
      setLoading(false);
      return;
    }

    try {
      let uploadedPhotoUrl = null;

      // 1. Upload photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
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

      // 2. Update Profile Phone
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileErr } = await supabase.from('profiles').update({ phone: formData.phone }).eq('id', user.id);
        if (profileErr) throw new Error('Failed to save phone number: ' + profileErr.message);
      }

      // 3. Submit to API
      const res = await fetch('/api/tags/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photoUrl: uploadedPhotoUrl })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to activate tag');

      // Redirect to success page
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
          Enter the unique QR Code ID printed on your Back2Me tag. Once activated, whoever scans the tag will see the information you provide below.
        </p>

        {error && (
          <div className="login-error" style={{ marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleActivate} className="login-form">
          <div className="form-group">
            <label htmlFor="qrCode">QR Code ID (e.g., B2M-WR-7X3K) *</label>
            <input
              type="text"
              id="qrCode"
              name="qrCode"
              placeholder="Enter the code on your tag"
              value={formData.qrCode}
              onChange={handleChange}
              required
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
            />
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
              disabled={loading} 
              style={{ minWidth: '160px' }}
            >
              {loading ? 'Activating...' : 'Activate Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
