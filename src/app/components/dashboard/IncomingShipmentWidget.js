'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const PARCEL_LABELS = {
  envelope: '✉️ Envelope',
  small: '📦 Small Package',
  medium: '📫 Medium Package',
  large: '🧳 Large Package',
};

const CARRIER_DROPOFF = {
  USPS: { name: 'USPS', location: 'Post Office', icon: '🏤' },
  UPS: { name: 'UPS', location: 'UPS Store / Access Point', icon: '🟤' },
  FedEx: { name: 'FedEx', location: 'FedEx Office / Drop Box', icon: '🟣' },
  DHL: { name: 'DHL', location: 'DHL ServicePoint', icon: '🟡' },
};

export default function IncomingShipmentWidget({ tagId }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRate, setSelectedRate] = useState(null);
  const [ratesData, setRatesData] = useState(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [error, setError] = useState(null);

  // Delivery step (appears AFTER rate selection)
  const [deliveryMode, setDeliveryMode] = useState('home');
  const [pickupAddress, setPickupAddress] = useState({
    name: '', street1: '', city: '', state: '', zip: ''
  });

  const supabase = createClient();

  useEffect(() => { loadShipments(); }, [tagId]);

  async function loadShipments() {
    const { data } = await supabase
      .from('shipments')
      .select('*')
      .eq('tag_id', tagId)
      .order('created_at', { ascending: false });
    if (data) setShipments(data);
    setLoading(false);
  }

  async function handleCheckRates(shipmentId) {
    setFetchingRates(true);
    setError(null);
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch rates');
      setRatesData(data);
      if (data.rates?.length > 0) {
        const std = data.rates.find(r => r.ui_label === 'Standard');
        setSelectedRate(std ? std.id : data.rates[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingRates(false);
    }
  }

  async function handleBuyLabel(shipmentId) {
    if (!selectedRate) return;

    // Validate pickup address if in pickup mode
    if (deliveryMode === 'pickup') {
      if (!pickupAddress.street1 || !pickupAddress.city || !pickupAddress.zip) {
        setError('Please fill in the full pickup location address.');
        return;
      }
    }

    setFetchingRates(true);
    setError(null);
    try {
      const body = {
        shipmentId,
        easypostShipmentId: ratesData.easypostShipmentId,
        rateId: selectedRate,
      };

      // If pickup mode, pass the override destination to checkout
      if (deliveryMode === 'pickup') {
        body.overrideDestination = pickupAddress;
      }

      const res = await fetch('/api/shipping/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setFetchingRates(false);
    }
  }

  if (loading) return null;
  if (shipments.length === 0) return null;

  const activeShipment = shipments[0];
  const parcelSizeKey = activeShipment.finder_address?.parcel_size || 'small';

  // Derive the locked carrier from the selected rate
  const selectedRateObj = ratesData?.rates?.find(r => r.id === selectedRate);
  const lockedCarrier = selectedRateObj?.carrier || null;
  const carrierInfo = lockedCarrier ? (CARRIER_DROPOFF[lockedCarrier] || { name: lockedCarrier, location: 'Location', icon: '📍' }) : null;

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none' };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #10b981', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.1)' }}>
      <h3 style={{ fontSize: '1.15rem', color: '#047857', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📦</span> Return Shipment Requested!
      </h3>

      {activeShipment.status === 'awaiting_owner_payment' && (
        <>
          <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '8px' }}>
            A finder in <strong>{activeShipment.finder_address?.city}, {activeShipment.finder_address?.state}</strong> wants to mail your item back.
          </p>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
            Item size: {PARCEL_LABELS[parcelSizeKey] || 'Unknown'}
          </p>

          {error && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}

          {/* ══ Phase 1: Calculate Rates ══ */}
          {!ratesData ? (
            <button onClick={() => handleCheckRates(activeShipment.id)} disabled={fetchingRates} className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981', width: '100%' }}>
              {fetchingRates ? 'Calculating rates...' : 'Calculate Shipping Rates'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* ══ Phase 2: Pick Shipping Speed ══ */}
              <h4 style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#64748b', letterSpacing: '0.03em' }}>1. Choose shipping speed:</h4>
              {ratesData.rates.map(rate => (
                <label key={rate.id} onClick={() => { setSelectedRate(rate.id); setDeliveryMode('home'); setPickupAddress({ name: '', street1: '', city: '', state: '', zip: '' }); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', border: '2px solid', borderColor: selectedRate === rate.id ? '#10b981' : '#e8ecf1', borderRadius: '12px', cursor: 'pointer', background: selectedRate === rate.id ? '#ecfdf5' : '#fff', transition: 'all 0.15s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedRate === rate.id ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedRate === rate.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1a2744' }}>{rate.ui_label}</span>
                        {rate.qr_supported && (
                          <span title="No printer needed — show QR at drop-off" style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 6px', borderRadius: '999px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', letterSpacing: '0.02em' }}>📱 QR</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{rate.ui_delivery} · via {rate.carrier}</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: selectedRate === rate.id ? '#047857' : '#1a2744' }}>${rate.rate}</span>
                </label>
              ))}

              {/* ══ Phase 3: Delivery Preference (carrier-locked) ══ */}
              {selectedRate && carrierInfo && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#64748b', letterSpacing: '0.03em' }}>2. Where should {carrierInfo.name} deliver it?</h4>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: deliveryMode === 'pickup' ? '12px' : '0' }}>
                    <button onClick={() => setDeliveryMode('home')} type="button" style={{ flex: 1, padding: '14px 10px', border: '2px solid', borderColor: deliveryMode === 'home' ? '#10b981' : '#e8ecf1', borderRadius: '12px', background: deliveryMode === 'home' ? '#ecfdf5' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease' }}>
                      <span style={{ display: 'block', fontSize: '1.3rem', marginBottom: '4px' }}>🏠</span>
                      <span style={{ fontWeight: '600', fontSize: '0.8rem', color: '#1a2744' }}>My Address</span>
                    </button>
                    <button onClick={() => setDeliveryMode('pickup')} type="button" style={{ flex: 1, padding: '14px 10px', border: '2px solid', borderColor: deliveryMode === 'pickup' ? '#10b981' : '#e8ecf1', borderRadius: '12px', background: deliveryMode === 'pickup' ? '#ecfdf5' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease' }}>
                      <span style={{ display: 'block', fontSize: '1.3rem', marginBottom: '4px' }}>{carrierInfo.icon}</span>
                      <span style={{ fontWeight: '600', fontSize: '0.8rem', color: '#1a2744' }}>{carrierInfo.location}</span>
                    </button>
                  </div>

                  {deliveryMode === 'pickup' && (
                    <div style={{ background: '#f8f9fb', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                        Enter the address of a nearby <strong>{carrierInfo.name} {carrierInfo.location}</strong> where you'd like to pick up your item.
                      </p>
                      <input type="text" placeholder={`${carrierInfo.name} location name`} value={pickupAddress.name} onChange={e => setPickupAddress(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                      <input type="text" placeholder="Street Address" value={pickupAddress.street1} onChange={e => setPickupAddress(p => ({ ...p, street1: e.target.value }))} style={inputStyle} />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" placeholder="City" value={pickupAddress.city} onChange={e => setPickupAddress(p => ({ ...p, city: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                        <input type="text" placeholder="State" value={pickupAddress.state} onChange={e => setPickupAddress(p => ({ ...p, state: e.target.value }))} style={{ ...inputStyle, width: '70px' }} />
                      </div>
                      <input type="text" placeholder="Zip Code" value={pickupAddress.zip} onChange={e => setPickupAddress(p => ({ ...p, zip: e.target.value }))} style={inputStyle} />
                    </div>
                  )}
                </div>
              )}

              {/* ══ Phase 4: Pay ══ */}
              <button onClick={() => handleBuyLabel(activeShipment.id)} disabled={fetchingRates || !selectedRate} className="btn btn-navy" style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '1rem', background: '#10b981', borderColor: '#10b981', borderRadius: '12px' }}>
                {fetchingRates ? 'Redirecting to payment...' : `Pay $${selectedRateObj?.rate || '—'} & Generate Label`}
              </button>

              <button onClick={() => { setRatesData(null); setSelectedRate(null); setDeliveryMode('home'); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', marginTop: '2px' }}>
                ← Recalculate rates
              </button>
            </div>
          )}
        </>
      )}

      {activeShipment.status === 'label_generated' && (
        <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
          <p style={{ margin: '0 0 4px', color: '#047857', fontWeight: '700', fontSize: '1rem' }}>✅ Label Generated!</p>
          <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#065f46', lineHeight: '1.5' }}>The label has been sent to the Finder's chat. Tracking begins once dropped off.</p>
          {activeShipment.tracking_code && (
            <div style={{ background: '#d1fae5', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: '#065f46' }}>Tracking Number</span>
              <p style={{ margin: '2px 0 0', fontWeight: '700', color: '#047857', letterSpacing: '0.08em', fontSize: '0.95rem' }}>{activeShipment.tracking_code}</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href={`/scan/label/${activeShipment.id}`} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#047857', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
              📱 View QR Code (No Printer Needed)
            </a>
            <a href={activeShipment.label_url} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'transparent', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
              🖨️ Download Label PDF
            </a>
          </div>
        </div>
      )}

      {activeShipment.status === 'in_transit' && (
        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0 0 8px', color: '#1e40af', fontWeight: 'bold' }}>🚚 In Transit</p>
          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#1e3a5f' }}>Your item is on its way! Tracking: <strong>{activeShipment.tracking_code}</strong></p>
        </div>
      )}

      {activeShipment.status === 'delivered' && (
        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #86efac' }}>
          <p style={{ margin: '0 0 8px', color: '#166534', fontWeight: 'bold' }}>🎉 Delivered!</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#14532d' }}>Your item has been delivered successfully.</p>
        </div>
      )}
    </div>
  );
}
