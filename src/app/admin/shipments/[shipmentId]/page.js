import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminShipmentDetailPage({ params }) {
  const { shipmentId } = await params;
  const supabase = createAdminClient();

  const { data: shipment, error } = await supabase
    .from('shipments')
    .select(`
      *,
      owner:profiles(id, name, email, phone, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country),
      tag:tags(qr_code, type, assigned_to)
    `)
    .eq('id', shipmentId)
    .single();

  if (error || !shipment) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <h2 style={{ color: '#dc2626' }}>Shipment Not Found</h2>
          <p>Could not load shipment data. Error: {error?.message}</p>
          <Link href="/admin/shipments" style={{ color: '#4b5563' }}>← Back to Shipments</Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'awaiting_owner_payment': return { bg: '#fef3c7', text: '#92400e' };
      case 'label_generated': return { bg: '#dbeafe', text: '#1e40af' };
      case 'in_transit': return { bg: '#e0e7ff', text: '#3730a3' };
      case 'delivered': return { bg: '#d1fae5', text: '#065f46' };
      default: return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const statusColors = getStatusColor(shipment.status);
  const finderAddress = shipment.finder_address || {};

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <Link href="/admin/shipments" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>
          ← Back to Shipments
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="admin-page-title">Shipment: {shipment.tracking_code || 'Pending'}</h1>
            <p className="admin-page-subtitle">ID: {shipment.id} • Created {new Date(shipment.created_at).toLocaleString()}</p>
          </div>
          <div>
            <span style={{ 
              padding: '6px 14px', 
              borderRadius: '16px', 
              fontSize: '13px', 
              fontWeight: '800',
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {shipment.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Logistics Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="admin-card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Label & Tracking</h2>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Tracking Code</div>
                {shipment.tracking_code ? (
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb', fontFamily: 'monospace' }}>
                    {shipment.tracking_code}
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>Not generated yet</div>
                )}
              </div>
              
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Label URL</div>
                {shipment.label_url ? (
                  <a href={shipment.label_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#f97316', fontWeight: '500', textDecoration: 'underline' }}>
                    Download / View Label ↗
                  </a>
                ) : (
                  <div style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>No URL available</div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>EasyPost Shipment ID</div>
                  <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#4b5563' }}>{shipment.easypost_shipment_id || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Stripe Intent ID</div>
                  <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#4b5563' }}>{shipment.stripe_payment_intent_id || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, color: '#166534', borderBottom: '1px solid #bbf7d0', paddingBottom: '12px' }}>Financials</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase' }}>Carrier Cost</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534' }}>{shipment.base_cost ? `$${shipment.base_cost}` : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase' }}>Our Margin</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534' }}>{shipment.markup_amount ? `$${shipment.markup_amount}` : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase' }}>Final Charge</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#14532d' }}>{shipment.final_price ? `$${shipment.final_price}` : '—'}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Routing Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="admin-card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Customer (Destination)</h2>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>
                <Link href={`/admin/users/${shipment.owner?.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                  {shipment.owner?.name || 'Unknown'} ↗
                </Link>
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 12px 0' }}>{shipment.owner?.email}</div>
              
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Registered Return Address</div>
              <div style={{ fontSize: '14px', lineHeight: '1.5', background: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                {shipment.owner?.shipping_street ? (
                  <>
                    <div style={{ fontWeight: '500' }}>{shipment.owner.shipping_name || shipment.owner.name}</div>
                    <div>{shipment.owner.shipping_street}</div>
                    <div>{shipment.owner.shipping_city}, {shipment.owner.shipping_state} {shipment.owner.shipping_zip}</div>
                    <div>{shipment.owner.shipping_country}</div>
                  </>
                ) : (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No default address set</span>
                )}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Finder (Origin)</h2>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Entered Location / Drop-off</div>
              <div style={{ fontSize: '14px', lineHeight: '1.5', background: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                {finderAddress.street1 ? (
                  <>
                    <div style={{ fontWeight: '500' }}>{finderAddress.name || 'Anonymous Finder'}</div>
                    <div>{finderAddress.street1}</div>
                    {finderAddress.street2 && <div>{finderAddress.street2}</div>}
                    <div>{finderAddress.city}, {finderAddress.state} {finderAddress.zip}</div>
                    <div>{finderAddress.country || 'US'}</div>
                    {finderAddress.parcel_size && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #d1d5db', fontSize: '13px', color: '#f97316', fontWeight: '600' }}>
                        Parcel Size: {finderAddress.parcel_size.toUpperCase()}
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Address not provided yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Associated Tag</h2>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f97316', color: 'white', padding: '8px', borderRadius: '4px', fontWeight: '800' }}>
                {shipment.tag?.type === 'wristband' ? 'QR' : 'B2M'}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontFamily: 'monospace' }}>{shipment.tag?.qr_code || 'Lost Data'}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Asset: {shipment.tag?.assigned_to || 'Unnamed'} ({shipment.tag?.type?.replace('_', ' ')})</div>
              </div>
            </div>
            {shipment.chat_session_id && (
              <div style={{ marginTop: '16px' }}>
                <Link href={`/admin/chats?session=${shipment.chat_session_id}`} style={{ padding: '6px 12px', background: '#1f2937', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}>
                  Locate in Chat History
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
