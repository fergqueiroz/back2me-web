'use client';

import { useTransition } from 'react';
import { toggleSupportFlag } from '../actions';

export function FlagSupportButton({ userId, isFlagged }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleSupportFlag(userId, isFlagged);
      if (res?.error) alert(`Failed to toggle support flag: ${res.error}`);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isFlagged ? "Unflag this account" : "Flag for Attention"}
      style={{
        padding: '6px 12px',
        backgroundColor: isFlagged ? '#fee2e2' : 'transparent',
        color: isFlagged ? '#b91c1c' : '#9ca3af',
        border: isFlagged ? '1px solid #fca5a5' : '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: isPending ? 'wait' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s ease'
      }}
    >
      {isPending ? '...' : isFlagged ? '🚩 Flagged' : '⚐ Flag'}
    </button>
  );
}
