'use client';

import { useState, useTransition } from 'react';
import { adjustInventory } from '../actions';

export function InventoryAdjustmentModal({ sku, onClose }) {
  const [isPending, startTransition] = useTransition();
  const [changeAmount, setChangeAmount] = useState('');
  const [actionType, setActionType] = useState('production_add');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!changeAmount || isNaN(changeAmount)) return;

    // Convert positive/negative based on action intuitively
    let finalAmount = parseInt(changeAmount, 10);
    if ((actionType === 'sold_deduction' || actionType === 'loss_damage') && finalAmount > 0) {
      finalAmount = -finalAmount; // auto make it negative
    }
    
    startTransition(async () => {
      const res = await adjustInventory(sku.id, finalAmount, actionType, notes);
      if (res?.error) {
        alert("Failed to adjust inventory: " + res.error);
      } else {
        onClose(); // success
      }
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="admin-card" style={{ width: '400px', backgroundColor: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <h2 style={{ marginTop: 0, fontSize: '18px', display: 'flex', justifyContent: 'space-between' }}>
          Adjust Stock: {sku.name}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </h2>
        
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
          Current stock level: <strong>{sku.stock_level}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Transaction Type</label>
            <select 
              value={actionType}
              onChange={e => setActionType(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="production_add">➕ Receive from Production / Printer</option>
              <option value="sold_deduction">➖ Fulfilled / Sold Kit</option>
              <option value="loss_damage">⚠️ Loss or Damage</option>
              <option value="manual_adjustment">⚙️ Manual Auditor Correction</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Quantity Change</label>
            <input 
              type="number" 
              required
              min="1"
              value={changeAmount}
              onChange={e => setChangeAmount(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              placeholder="e.g., 50"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Audit Note (Required)</label>
            <textarea 
              required
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '60px' }}
              placeholder="Received Batch #44 from printer..."
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isPending}
              style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0f172a', color: '#fff', cursor: isPending ? 'wait' : 'pointer' }}
            >
              {isPending ? 'Saving...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InventoryManagerGrid({ skus }) {
  const [editingSku, setEditingSku] = useState(null);

  // Group by type for clean display
  const types = ['wristband', 'sticker', 'luggage_tag', 'pet_tag'];

  return (
    <div>
      {types.map(t => {
        const typeSkus = skus.filter(s => s.type === t);
        if (typeSkus.length === 0) return null;
        
        return (
          <div key={t} className="admin-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, textTransform: 'capitalize', fontSize: '15px', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
              {t.replace('_', ' ')}s
            </h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU Name</th>
                  <th>Total Sold</th>
                  <th>In Stock (Ready)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {typeSkus.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '500' }}>{s.name}</td>
                    <td style={{ color: '#059669', fontWeight: 'bold' }}>{s.sold_level || 0}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '13px',
                        fontWeight: 'bold',
                        backgroundColor: s.stock_level < 20 ? '#fee2e2' : '#f3f4f6',
                        color: s.stock_level < 20 ? '#b91c1c' : '#1f2937'
                      }}>
                        {s.stock_level}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => setEditingSku(s)}
                        style={{ padding: '4px 10px', fontSize: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {editingSku && (
        <InventoryAdjustmentModal sku={editingSku} onClose={() => setEditingSku(null)} />
      )}
    </div>
  );
}
