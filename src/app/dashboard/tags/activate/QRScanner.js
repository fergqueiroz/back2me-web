'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onError, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Create scanner instance
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Stop scanning after successful scan
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        onScan(decodedText);
      },
      (errorMessage) => {
        if (onError) onError(errorMessage);
      }
    );

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return (
    <div style={{ background: '#f8f9fb', padding: '16px', borderRadius: '12px', border: '1px solid #e8ecf1', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1a2744' }}>Scan QR Code</h3>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>
          ✕
        </button>
      </div>
      <div id="qr-reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>
      <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
        Point your camera at the QR code on your Back2Me tag.
      </p>
    </div>
  );
}
