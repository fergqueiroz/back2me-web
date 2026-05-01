'use client';

import { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';

export default function TwilioVoiceButton({ tagId, ownerName }) {
  const [device, setDevice] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, in-progress, disconnected
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);
  const callRef = useRef(null);

  // Initialize the device on click to save bandwidth if they never call
  const handleStartCall = async () => {
    console.log(">>> TWILIO VOICE BUTTON CLICKED! Starting initialization sequence...");
    try {
      setCallStatus('connecting');

      // 1. Fetch Twilio Token
      console.log(">>> Fetching Twilio Token from /api/voice/token...");
      const res = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: `finder_${Date.now()}` })
      });
      const data = await res.json();
      
      console.log(">>> Token Response received:", data);
      
      if (!res.ok || !data.token) throw new Error(data.error || 'Failed to fetch token');

      // 2. Setup Device
      const twilioDevice = new Device(data.token, {
        codecPreferences: ['opus', 'pcmu'],
        fakeLocalDTMF: true,
        enableRingingState: true
      });

      // 3. Dial Out
      const params = { tagId: tagId };
      const call = twilioDevice.connect({ params });
      
      call.then((activeCall) => {
        callRef.current = activeCall;

        activeCall.on('accept', () => {
           setCallStatus('in-progress');
           timerRef.current = setInterval(() => {
             setCallDuration(prev => prev + 1);
           }, 1000);
        });

        activeCall.on('disconnect', () => {
           cleanupCall();
        });

        activeCall.on('error', (err) => {
           console.error("Call error:", err);
           alert("Error connecting call: " + err.message);
           cleanupCall();
        });
      }).catch(err => {
           console.error("Connect promise error:", err);
           alert("Could not connect to microphone. " + err.message);
           cleanupCall();
      });

      twilioDevice.on('error', (err) => {
        console.error("Device error:", err);
        cleanupCall();
      });

      setDevice(twilioDevice);

    } catch (e) {
      console.error(e);
      alert("Failed to initiate call. Make sure you granted microphone permissions.");
      cleanupCall();
    }
  };

  const cleanupCall = () => {
    setCallStatus('disconnected');
    clearInterval(timerRef.current);
    if (callRef.current) callRef.current.disconnect();
    if (device) device.destroy();
    
    setTimeout(() => {
      setCallStatus('idle');
      setCallDuration(0);
    }, 3000); // go back to normal button after 3 seconds
  };

  const handleEndCall = () => {
    cleanupCall();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (callStatus === 'idle') {
    return (
      <button onClick={handleStartCall} className="btn scan-btn-main" style={{ marginTop: '12px', background: '#16a34a', color: '#fff' }}>
        <span style={{ fontSize: '1.4rem' }}>📞</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>Call {ownerName} (Masked)</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 'normal' }}>Free Internet Call. 100% Secure.</span>
        </div>
      </button>
    );
  }

  if (callStatus === 'connecting') {
    return (
      <div className="btn scan-btn-main" style={{ marginTop: '12px', background: '#1e293b', color: '#fff', cursor: 'default' }}>
        <span style={{ fontSize: '1.4rem' }}>⏳</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>Connecting Protocol...</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 'normal' }}>Establishing Secure WebRTC Tunnel</span>
        </div>
      </div>
    );
  }

  return (
    <div className="btn scan-btn-main" style={{ marginTop: '12px', background: '#1a2744', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '1.4rem', animation: 'radar-ping 2s infinite' }}>🎧</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '12px' }}>
           <span style={{ fontWeight: 'bold', color: '#4ade80' }}>
             {callStatus === 'in-progress' ? 'Connected' : 'Ended'}
           </span>
           <span style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: 'normal' }}>
             {callStatus === 'in-progress' ? `Duration: ${formatTime(callDuration)}` : 'Call Finished'}
           </span>
        </div>
      </div>
      
      {callStatus === 'in-progress' && (
        <button onClick={handleEndCall} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
           End
        </button>
      )}
    </div>
  );
}
