'use client';

import { useTransition } from 'react';
import { updateCustomerRecord, toggleTagStatus, updateSupportNotes } from '../../actions';

export function SupportNotesForm({ user }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = async (formData) => {
    startTransition(async () => {
      const res = await updateSupportNotes(user.id, formData);
      if (res?.error) alert(`Failed to save notes: ${res.error}`);
    });
  };

  return (
    <div className="admin-card" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '700', marginTop: 0, color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📝</span> Internal Support Notes
      </h2>
      <p style={{ fontSize: '13px', color: '#92400e', margin: '4px 0 12px 0' }}>
        Visible only to admins. Use this to track delayed payments or customer service cases.
      </p>
      
      <form action={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea 
          name="support_notes" 
          defaultValue={user.support_notes || ''}
          placeholder="Issue ongoing, awaiting gateway clearance..."
          style={{ 
            width: '100%', 
            padding: '10px', 
            fontSize: '13px', 
            borderRadius: '6px', 
            border: '1px solid #fcd34d', 
            backgroundColor: '#fff',
            minHeight: '80px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <button 
          type="submit" 
          disabled={isPending}
          style={{ 
            padding: '6px', 
            backgroundColor: isPending ? '#d1d5db' : '#d97706', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: '600',
            fontSize: '13px',
            cursor: isPending ? 'wait' : 'pointer',
            alignSelf: 'flex-end',
            transition: 'all 0.2s'
          }}
        >
          {isPending ? 'Saving...' : 'Save Notes'}
        </button>
      </form>
    </div>
  );
}

export function CustomerEditForm({ user }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = async (formData) => {
    startTransition(async () => {
      const res = await updateCustomerRecord(user.id, formData);
      if (res?.error) {
        alert(`Failed to update customer: ${res.error}`);
      } else {
         // Revalidation happens automatically in actions.js
      }
    });
  };

  return (
    <form action={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      
      <div>
        <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Phone</label>
        <input 
          type="text" 
          name="phone" 
          defaultValue={user.phone || ''}
          placeholder="+1 (555) 000-0000"
          style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Plan Status</label>
          <select 
            name="plan_status" 
            defaultValue={user.plan_status}
            style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}
          >
            <option value="incomplete">Incomplete</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Plan Tier</label>
          <select 
            name="plan" 
            defaultValue={user.plan}
            style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}
          >
            <option value="starter">Starter</option>
            <option value="plus">Plus</option>
            <option value="elite">Elite</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>System Role</label>
        <select 
          name="role" 
          defaultValue={user.role || 'user'}
          style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}
        >
          <option value="user">USER (Standard)</option>
          <option value="support">SUPPORT (Limited Admin)</option>
          <option value="admin">ADMIN (Full Access)</option>
        </select>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: isPending ? '#9ca3af' : '#2563eb', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          fontWeight: '600',
          cursor: isPending ? 'not-allowed' : 'pointer'
        }}
      >
        {isPending ? 'Saving Analysis...' : 'Save Customer Record'}
      </button>

    </form>
  );
}

export function CustomerDangerZone({ user }) {
  const [isPending, startTransition] = useTransition();

  const isDeactivated = user.plan_status === 'cancelled';

  const handleDeactivate = () => {
    if (!confirm(`Are you sure you want to ${isDeactivated ? 'REACTIVATE' : 'DEACTIVATE'} this user?`)) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('plan_status', isDeactivated ? 'active' : 'cancelled');
      const res = await updateCustomerRecord(user.id, formData);
      if (res?.error) alert(`Action failed: ${res.error}`);
    });
  };

  return (
    <div className="admin-card" style={{ backgroundColor: isDeactivated ? '#fef2f2' : '#fff5f5', border: '1px solid #fed7d7' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, color: '#9b2c2c' }}>Danger Zone</h2>
      <p style={{ fontSize: '13px', color: '#742a2a', marginTop: '8px' }}>
        {isDeactivated ? 'This account is currently blocked/cancelled.' : 'Force cancel this user account to restrict access immediately.'}
      </p>
      <button 
        onClick={handleDeactivate}
        disabled={isPending}
        style={{ 
          marginTop: '12px', 
          padding: '8px 16px', 
          background: isDeactivated ? '#4b5563' : '#e53e3e', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: isPending ? 'wait' : 'pointer',
          fontWeight: '600'
        }}
      >
        {isPending ? 'Processing...' : isDeactivated ? 'Reactivate Account' : 'Deactivate Account'}
      </button>
    </div>
  );
}

export function TagStatusToggle({ tagId, currentStatus, userId }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleTagStatus(tagId, userId);
      if (res?.error) alert(`Failed to toggle tag: ${res.error}`);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      style={{
        padding: '4px 10px',
        backgroundColor: currentStatus === 'active' ? '#ef4444' : '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: isPending ? 'wait' : 'pointer',
        textTransform: 'uppercase'
      }}
    >
      {isPending ? '...' : currentStatus === 'active' ? 'Suspend' : 'Activate'}
    </button>
  );
}
