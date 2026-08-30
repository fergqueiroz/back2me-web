'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onError, onClose }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        setCameraError('');
        const devices = await Html5Qrcode.getCameras();
        
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera on mobile, or fallback to first available camera (webcam on desktop/laptop)
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira') || d.label.toLowerCase().includes('rear'));
          const defaultCamId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(defaultCamId);
          startScanner(defaultCamId);
        } else {
          setCameraError('Nenhuma câmera ou webcam foi encontrada no seu computador ou dispositivo.');
        }
      } catch (err) {
        console.error('Error fetching cameras:', err);
        if (!isMounted) return;
        setCameraError('Permissão de acesso à câmera/webcam foi negada ou não é suportada pelo navegador.');
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId) => {
    try {
      await stopScanner();
      
      const html5Qrcode = new Html5Qrcode("qr-reader-canvas");
      html5QrcodeRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minDim * 0.7),
            height: Math.floor(minDim * 0.7)
          };
        },
        aspectRatio: 1.333333
      };

      await html5Qrcode.start(
        cameraId,
        config,
        (decodedText) => {
          stopScanner();
          onScan(decodedText);
        },
        (errorMessage) => {
          if (onError) onError(errorMessage);
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
      setCameraError('Não foi possível iniciar a webcam. Verifique se o seu navegador tem permissão para acessar a câmera.');
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch (e) {
        // Ignore stop errors on unmount
      }
      html5QrcodeRef.current = null;
    }
    setIsScanning(false);
  };

  const handleCameraChange = (e) => {
    const newCamId = e.target.value;
    setSelectedCameraId(newCamId);
    startScanner(newCamId);
  };

  return (
    <div style={{ background: '#0f172a', padding: '20px', borderRadius: '16px', color: '#fff', marginBottom: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>📷</span>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: '700' }}>
            Scanner de Tag (Computador & Celular)
          </h3>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        )}
      </div>

      {cameraError ? (
        <div style={{ background: '#451a1a', border: '1px solid #f87171', color: '#fca5a5', padding: '16px', borderRadius: '10px', textAlign: 'center', fontSize: '0.9rem' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>⚠️ Câmera / Webcam Indisponível</p>
          <p style={{ margin: 0 }}>{cameraError}</p>
        </div>
      ) : (
        <>
          {cameras.length > 1 && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Selecionar Câmera / Webcam:
              </label>
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.85rem' }}
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Câmera ${cam.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ position: 'relative', width: '100%', background: '#020617', borderRadius: '12px', overflow: 'hidden', minHeight: '260px', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div id="qr-reader-canvas" style={{ width: '100%' }}></div>
          </div>

          <p style={{ margin: '14px 0 0', fontSize: '0.85rem', color: '#cbd5e1', textAlign: 'center', lineHeight: '1.4' }}>
            💡 Segure a sua tag Back2Me na frente da <strong>webcam do seu computador</strong> ou da <strong>câmera do celular</strong> até o código ser reconhecido.
          </p>
        </>
      )}
    </div>
  );
}
