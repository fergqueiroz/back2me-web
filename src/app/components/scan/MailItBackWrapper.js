'use client';

import { useState } from 'react';
import MailItBackFlow from './MailItBackFlow';

export default function MailItBackWrapper({ tagId, chatId }) {
  const [showFlow, setShowFlow] = useState(false);

  if (showFlow) {
    return <MailItBackFlow tagId={tagId} chatSessionId={chatId} onCancel={() => setShowFlow(false)} />;
  }

  return (
    <button onClick={() => setShowFlow(true)} className="btn btn-outline scan-btn-secondary" style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <span>📦</span> Mail it Back (We Pay)
    </button>
  );
}
