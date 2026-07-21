import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ScanClientHandler from '@/app/components/scan/ScanClientHandler';
import TwilioVoiceButton from '@/app/components/scan/TwilioVoiceButton';
import MailItBackWrapper from '@/app/components/scan/MailItBackWrapper';
import Link from 'next/link';
import './scan.css';

export async function generateMetadata({ params }) {
  const { tagId } = await params;
  const supabase = await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagId);
  const { data: tag } = isUuid 
    ? await supabase.from('tags').select('assigned_to, type, status').eq('id', tagId).single()
    : await supabase.from('tags').select('assigned_to, type, status').eq('qr_code', tagId).single();

  if (!tag || tag.status !== 'active') {
    return { title: 'Tag Not Found | Back2Me Global' };
  }

  return {
    title: `Help return ${tag.assigned_to || 'this item'} | Back2Me Global`,
    description: `You've found a Back2Me protected ${tag.type.replace('_', ' ')}. Scan to contact the owner anonymously.`
  };
}

export default async function ScanPage({ params }) {
  const { tagId } = await params;
  const supabase = await createClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagId);
  const selectFields = `
    id, qr_code, type, color, assigned_to, category, owner_message, medical_info, status, photo_url,
    profiles (name, avatar_url)
  `;

  // 1. Fetch tag by UUID or QR Code String
  const { data: tag, error } = isUuid
    ? await supabase.from('tags').select(selectFields).eq('id', tagId).single()
    : await supabase.from('tags').select(selectFields).eq('qr_code', tagId).single();

  if (error || !tag) {
    notFound();
  }

  if (tag.status === 'unregistered') {
    return (
      <div className="scan-public-page">
        <div className="scan-container text-center">
          <h2>This tag has not been activated.</h2>
          <p>If you own this tag, please log in to your dashboard to activate it.</p>
          <Link href="/login" className="btn btn-navy">Log In to Activate</Link>
        </div>
      </div>
    );
  }

  if (tag.status === 'inactive') {
    return (
      <div className="scan-public-page">
        <div className="scan-container text-center">
          <h2>This tag is currently inactive.</h2>
          <p>The owner has temporarily disabled this tag. No information can be shown.</p>
        </div>
      </div>
    );
  }

  const ownerName = tag.profiles?.name?.split(' ')[0] || 'The Owner';

  return (
    <div className="scan-public-page" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      
      {/* Radar Sweep Animation */}
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fb;
        }
        .radar-sweep-light {
          position: absolute;
          width: 250vmax;
          height: 250vmax;
          background: conic-gradient(from 0deg, transparent 70%, rgba(255, 96, 0, 0.08) 100%);
          border-radius: 50%;
          animation: radar-sweep 6s linear infinite;
        }
        /* Faint concentric tracking circles to ground the sweep */
        .radar-ring-static {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(26, 39, 68, 0.03);
        }
        .scan-container {
          position: relative;
          z-index: 10;
        }
      `}</style>

      {/* Radar Background */}
      <div className="radar-bg">
        <div className="radar-ring-static" style={{ width: '40vh', height: '40vh' }}></div>
        <div className="radar-ring-static" style={{ width: '80vh', height: '80vh' }}></div>
        <div className="radar-ring-static" style={{ width: '120vh', height: '120vh' }}></div>
        <div className="radar-sweep-light"></div>
      </div>

      {/* Client Component purely for tracking the scan event (GPS, IP) and generating a finder token */}
      <ScanClientHandler tagId={tag.id} />

      <div className="scan-container">
        
        <div className="scan-header">
          <div className="scan-logo">
            <span style={{ color: 'var(--orange)', fontWeight: '800' }}>Back2Me</span>
            <span style={{ color: 'var(--navy)', fontWeight: '800', marginLeft: '6px' }}>GLOBAL</span>
          </div>
          <p className="scan-hero-text">Someone is looking for this.</p>
        </div>

        {/* Identity Card */}
        <div className="scan-card scan-identity-card" style={{ border: '2px solid rgba(255, 96, 0, 0.2)', boxShadow: '0 12px 32px rgba(26, 39, 68, 0.08)', background: 'linear-gradient(180deg, #fff 0%, #fafbfc 100%)' }}>
          <div className="scan-photo">
            {tag.photo_url ? (
              <img src={tag.photo_url} alt={tag.assigned_to} />
            ) : (
              <div className="scan-photo-placeholder">📷</div>
            )}
          </div>
          <div className="scan-identity-info">
            <h1 className="scan-title" style={{ fontSize: '1.6rem', color: 'var(--navy)', marginTop: '2px' }}>
              {tag.assigned_to || 'Unknown Item'}
            </h1>
            <p className="scan-subtitle">{tag.type.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Message from Owner */}
        {tag.owner_message && (
          <div className="scan-card scan-message-card">
            <h3>Message from {ownerName}:</h3>
            <p className="scan-message-text">"{tag.owner_message}"</p>
          </div>
        )}

        {/* Medical Info */}
        {tag.medical_info && (
          <div className="scan-card scan-medical-card">
            <div className="scan-card-header">
              <span className="scan-icon warning">⚠️</span>
              <h3>Medical / Vital Info</h3>
            </div>
            <p>{tag.medical_info}</p>
          </div>
        )}

        {/* Actions */}
        <div className="scan-actions">
          <Link href={`/scan/${tag.id}/chat`} className="btn btn-navy scan-btn-main">
            <span style={{ fontSize: '1.4rem' }}>💬</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>Chat with {ownerName}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'normal' }}>100% anonymous. No apps needed.</span>
            </div>
          </Link>

          <TwilioVoiceButton tagId={tag.id} ownerName={ownerName} />

          <MailItBackWrapper tagId={tag.id} />
        </div>

        <div className="scan-footer text-center">
          <p>⏰ {ownerName} was just notified that this tag was scanned.</p>
          <div style={{ marginTop: '24px', opacity: 0.5 }}>
            <span style={{ fontSize: '0.7rem' }}>ID: {tag.qr_code}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
