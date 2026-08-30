'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import IncomingShipmentWidget from '@/app/components/dashboard/IncomingShipmentWidget';

export default function TagDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [formData, setFormData] = useState({
    assigned_to: '',
    category: '',
    owner_message: '',
    medical_info: '',
    status: 'active',
    photo_url: '',
    phone: ''
  });

  const supabase = createClient();

  useEffect(() => {
    loadTag();
  }, [params.tagId]);

  async function loadTag() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', params.tagId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      router.push('/dashboard/tags');
      return;
    }

    setTag(data);
    setFormData({
      assigned_to: data.assigned_to || '',
      category: data.category || 'other',
      owner_message: data.owner_message || '',
      medical_info: data.medical_info || '',
      status: data.status,
      photo_url: data.photo_url || '',
      phone: data.phone || ''
    });
    setPhotoPreview(data.photo_url || null);
    setLoading(false);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccessMsg(''); // Clear success message on edit
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
    setSuccessMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (formData.phone) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('Phone number must be in E.164 international format (e.g., +16063320861)');
        setSaving(false);
        return;
      }
    }

    try {
      let finalPhotoUrl = formData.photo_url;

      // Upload new photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${tag.id}_${Date.now()}.${fileExt}`;
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

        finalPhotoUrl = publicUrlData.publicUrl;
      }

      const updateData = { ...formData, photo_url: finalPhotoUrl };

      const { error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', tag.id);

      if (error) {
        throw error;
      }

      setFormData(updateData);
      setPhotoFile(null); // Clear selected file state
      setSuccessMsg('Changes saved successfully');

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );
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

  return (
    <div className="dash-page">
      <div className="dash-section-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard/tags" style={{ color: '#888', textDecoration: 'none', fontSize: '1.2rem', padding: '4px' }}>
            ←
          </Link>
          <h1 className="dash-page-title" style={{ margin: 0 }}>{tag.assigned_to || 'Tag Details'}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`dash-stat-status ${tag.status === 'active' ? 'active' : 'warning'}`} style={{ position: 'static' }}>
            {tag.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          <Link href={`/scan/${tag.id}`} target="_blank" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            Preview Public Page
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '32px' }}>
        
        {/* Left Col: Edit Form */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #e8ecf1' }}>
          <h2 className="dash-section-title">Tag Information</h2>
          
          {error && <div className="login-error" style={{ marginBottom: '20px' }}>{error}</div>}
          {successMsg && <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>{successMsg}</div>}

          <form onSubmit={handleSave} className="login-form">

            {/* Photo Section */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Tag Photo</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100px', height: '100px', borderRadius: '16px', background: '#f8f9fb', 
                    border: '1px dashed #d0d5dd', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', flexShrink: 0
                  }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.8rem', color: '#aaa' }}>📷</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: '6px' }}>
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>JPEG, PNG up to 5MB. Clear photos help finders identify items/people faster.</p>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoSelect} style={{ display: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Assigned To</label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
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

            <div className="form-group">
              <label htmlFor="phone">Override Phone Number (For Voice Calls)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="e.g. +16063320861"
                value={formData.phone}
                onChange={handleChange}
                style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#888' }}>
                Finders can call you, but your number stays private. (Leave blank to use your user profile's phone globally).
              </p>
            </div>

            <div className="form-group">
              <label>Message to Finder</label>
              <textarea
                name="owner_message"
                rows={4}
                value={formData.owner_message}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d0d5dd', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-group">
              <label>Medical / Vital Info</label>
              <textarea
                name="medical_info"
                rows={2}
                value={formData.medical_info}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d0d5dd', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>Tag Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d0d5dd', borderRadius: '10px', fontSize: '0.95rem', background: '#fff' }}
              >
                <option value="active">Active (Scannable)</option>
                <option value="inactive">Inactive (Hidden when scanned)</option>
              </select>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-navy" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Tag Hardware & Scans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <IncomingShipmentWidget tagId={tag.id} />
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e8ecf1' }}>
            <h3 style={{ fontSize: '1rem', color: '#1a2744', margin: '0 0 16px' }}>Tag Presentation</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div className="dash-tag-icon" style={{ width: '64px', height: '64px', overflow: 'hidden', padding: 0 }}>
                <img 
                  src={hardwareImages[tag.type]?.[tag.color] || '/logo.png'} 
                  alt={tag.type} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'capitalize' }}>
                  {tag.type.replace('_', ' ')}
                </div>
                <div style={{ fontWeight: '600' }}>{tag.color} colored</div>
              </div>
            </div>

            <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e8ecf1' }}>
              <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '2px' }}>QR CODE ID</span>
              <span style={{ fontSize: '1.2rem', color: '#1a2744', fontWeight: 'bold', fontFamily: 'monospace' }}>{tag.qr_code}</span>
            </div>
            
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#aaa' }}>
              Activated on {new Date(tag.activated_at).toLocaleDateString()}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e8ecf1' }}>
            <h3 style={{ fontSize: '1rem', color: '#1a2744', margin: '0 0 16px' }}>Scan Activity</h3>
            <div className="dash-empty-state small" style={{ padding: '16px', background: '#f8f9fb' }}>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>No scans recorded yet.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
