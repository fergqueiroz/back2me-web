'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Your Tag';
  const tagId = searchParams.get('id');

  return (
    <div style={{ 
      background: '#fff', 
      padding: '48px 40px', 
      borderRadius: '24px', 
      border: '1px solid #e8ecf1', 
      textAlign: 'center',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
    }}>
      <div style={{ 
        fontSize: '4rem', 
        marginBottom: '24px',
        background: '#f8f9fb',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        ✅
      </div>
      
      <h1 style={{ fontSize: '1.8rem', color: '#1a2744', margin: '0 0 12px' }}>
        Tag Activated!
      </h1>
      
      <p style={{ color: '#555', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 32px' }}>
        <strong>{name}</strong> is now protected by the Back2Me Global network. Anyone who scans your tag will have a direct, anonymous line to reach you.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link href={tagId ? `/dashboard/tags/${tagId}` : '/dashboard/tags'} className="btn btn-orange" style={{ padding: '14px', fontSize: '1rem', borderRadius: '12px' }}>
          Manage This Tag
        </Link>
        <Link href="/dashboard" className="btn btn-outline" style={{ padding: '14px', fontSize: '1rem', borderRadius: '12px' }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function ActivationSuccessPage() {
  return (
    <div className="dash-page" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <Suspense fallback={<div className="dash-spinner" />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
