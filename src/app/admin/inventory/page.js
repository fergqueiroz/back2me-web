import { createAdminClient } from '@/lib/supabase/server';
import { InventoryManagerGrid } from './AdminInventoryClient';

export default async function AdminInventoryPage() {
  const supabase = createAdminClient();

  // 1. Fetch SKUs
  const { data: skus, error: skuErr } = await supabase
    .from('inventory_skus')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  // 2. Fetch Ledger Log
  const { data: ledger, error: ledgerErr } = await supabase
    .from('inventory_ledger')
    .select(`
      id,
      action_type,
      qty_change,
      previous_stock,
      new_stock,
      notes,
      created_at,
      profiles:admin_id (name),
      inventory_skus:sku_id (name)
    `)
    .order('created_at', { ascending: false })
    .limit(30);

  if (skuErr) return <div>Error loading inventory: {skuErr.message}</div>;

  const totalInStock = skus?.reduce((sum, s) => sum + (s.stock_level || 0), 0) || 0;
  const totalSold = skus?.reduce((sum, s) => sum + (s.sold_level || 0), 0) || 0;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h2>📦 Merchandise Inventory</h2>
          <p>Track your physical printed tags (SKUs) ready for fulfillment.</p>
        </div>
      </header>

      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card">
          <div className="stat-label">Total Ready-to-Ship Items</div>
          <div className="stat-value">{totalInStock} unit(s)</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-label">Total Items Sold (All Time)</div>
          <div className="stat-value">{totalSold} unit(s)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: SKU interactive grid */}
        <div>
          <InventoryManagerGrid skus={skus || []} />
        </div>

        {/* Right Side: Ledger (Audit Trail) */}
        <div className="admin-card" style={{ backgroundColor: '#f8fafc' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            📜 Recent Ledger History
          </h3>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {ledger?.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b' }}>No inventory movements yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ledger?.map(entry => (
                  <li key={entry.id} style={{ fontSize: '12px', padding: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: entry.qty_change > 0 ? '#16a34a' : '#dc2626' }}>
                        {entry.qty_change > 0 ? '➕ ' : '➖ '}{Math.abs(entry.qty_change)} {entry.inventory_skus?.name}
                      </span>
                    </div>
                    <div style={{ color: '#475569', marginBottom: '4px' }}>
                      Type: <strong>{entry.action_type.replace('_', ' ')}</strong>
                    </div>
                    <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '8px' }}>
                      "{entry.notes}"
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                      <span>By {entry.profiles?.name || 'Admin'}</span>
                      <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
