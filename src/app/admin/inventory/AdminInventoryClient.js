'use client';

import { useState, useTransition, useEffect } from 'react';
import { adjustInventory, getInStockCodesForSku } from '../actions';

export function SkuStockCodesModal({ sku, onClose }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    async function loadCodes() {
      setLoading(true);
      const res = await getInStockCodesForSku(sku.id);
      if (res.tags) {
        setTags(res.tags);
      }
      setLoading(false);
    }
    loadCodes();
  }, [sku.id]);

  const filteredTags = tags.filter(t => t.qr_code.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCopyAll = () => {
    const allCodes = filteredTags.map(t => t.qr_code).join('\n');
    navigator.clipboard.writeText(allCodes);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyOne = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div className="admin-card" style={{ width: '100%', maxWidth: '650px', backgroundColor: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '4px', fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦 Tags em Estoque:</span>
              <span style={{ color: '#0284c7' }}>{sku.name}</span>
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              {loading ? 'Carregando códigos...' : `Total de ${tags.length} código(s) com status "in_stock"`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <input
            type="text"
            placeholder="Buscar por código QR (B2M-XXXX)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', flex: 1, minWidth: '200px' }}
          />

          <button
            onClick={handleCopyAll}
            disabled={filteredTags.length === 0}
            className="btn"
            style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', fontWeight: '600', opacity: filteredTags.length === 0 ? 0.5 : 1 }}
          >
            {copiedAll ? '✅ Códigos Copiados!' : `📋 Copiar Todos (${filteredTags.length})`}
          </button>
        </div>

        {/* Codes List Table */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              Buscando tags físicas com status in_stock no banco...
            </div>
          ) : filteredTags.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              {tags.length === 0 ? 'Nenhuma tag física com status "in_stock" para este produto.' : 'Nenhum código corresponde à busca.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 14px' }}>#</th>
                  <th style={{ padding: '10px 14px' }}>Código QR</th>
                  <th style={{ padding: '10px 14px' }}>Data de Criação</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map((tag, idx) => (
                  <tr key={tag.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                      {tag.qr_code}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>
                      {new Date(tag.created_at).toLocaleDateString('pt-BR')} {new Date(tag.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleCopyOne(tag.qr_code)}
                        style={{ padding: '4px 10px', fontSize: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}
                      >
                        {copiedCode === tag.qr_code ? '✅ Copiado' : '📋 Copiar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}

export function InventoryAdjustmentModal({ sku, onClose }) {
  const [isPending, startTransition] = useTransition();
  const [changeAmount, setChangeAmount] = useState('');
  const [actionType, setActionType] = useState('production_add');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!changeAmount || isNaN(changeAmount)) return;

    let finalAmount = parseInt(changeAmount, 10);
    if ((actionType === 'sold_deduction' || actionType === 'loss_damage') && finalAmount > 0) {
      finalAmount = -finalAmount;
    }
    
    startTransition(async () => {
      const res = await adjustInventory(sku.id, finalAmount, actionType, notes);
      if (res?.error) {
        alert("Failed to adjust inventory: " + res.error);
      } else {
        onClose();
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
  const [selectedStockCodesSku, setSelectedStockCodesSku] = useState(null);

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
                      <button
                        onClick={() => setSelectedStockCodesSku(s)}
                        title="Clique para ver os códigos QR em estoque"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '13px',
                          fontWeight: 'bold',
                          backgroundColor: s.stock_level < 20 ? '#fee2e2' : '#d1fae5',
                          color: s.stock_level < 20 ? '#b91c1c' : '#065f46',
                          border: '1px solid transparent',
                          transition: 'all 0.2s'
                        }}>
                          📦 {s.stock_level} em estoque (Ver Códigos 🔍)
                        </span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedStockCodesSku(s)}
                          style={{ padding: '4px 10px', fontSize: '12px', background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          🔍 Ver Códigos
                        </button>
                        <button 
                          onClick={() => setEditingSku(s)}
                          style={{ padding: '4px 10px', fontSize: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Adjust Stock
                        </button>
                      </div>
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

      {selectedStockCodesSku && (
        <SkuStockCodesModal sku={selectedStockCodesSku} onClose={() => setSelectedStockCodesSku(null)} />
      )}
    </div>
  );
}
