'use client';

import { useState, useEffect, useRef } from 'react';

const shippingZones = {
  domestic_eua: { name: 'Domestic EUA', standard: 5.90, express: 21.90, std_time: '3-5 days', exp_time: '1-2 days', free_eligible: true },
  canada: { name: 'Canada', standard: 15.00, express: 44.90, std_time: '7-14 days', exp_time: '3-5 days', free_eligible: false },
  mexico: { name: 'Mexico', standard: 15.00, express: 47.90, std_time: '10-21 days', exp_time: '5-7 days', free_eligible: false },
  europe: { name: 'Europe', standard: 20.00, express: 64.90, std_time: '10-21 days', exp_time: '3-5 days', free_eligible: false },
  south_america: { name: 'South America', standard: 20.00, express: 74.90, std_time: '15-30 days', exp_time: '5-7 days', free_eligible: false },
  oceania: { name: 'Oceania', standard: 22.00, express: 84.90, std_time: '15-30 days', exp_time: '7-10 days', free_eligible: false },
  africa_asia: { name: 'Africa / Asia', standard: 25.00, express: 94.90, std_time: '15-30 days', exp_time: '7-10 days', free_eligible: false },
};

export default function ShippingStage({ hardwareTotal, onShippingUpdate }) {
  const [address, setAddress] = useState({
    name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    zone: ''
  });
  
  const [method, setMethod] = useState('standard'); // 'standard' or 'express'

  const handleZoneChange = (e) => {
    const zoneKey = e.target.value;
    const zoneInfo = shippingZones[zoneKey];
    setAddress({ ...address, zone: zoneKey });
    
    if (zoneInfo) {
      updateParent(zoneKey, method);
    }
  };

  const handleMethodChange = (m) => {
    setMethod(m);
    if (address.zone) {
      updateParent(address.zone, m);
    }
  };

  const updateParent = (zKey, mKey, currentAddress) => {
    const zone = shippingZones[zKey];
    let price = mKey === 'standard' ? zone.standard : zone.express;
    
    // Check for Free Shipping Rule: Only domestic EUA and hardware > $15
    if (mKey === 'standard' && zone.free_eligible && hardwareTotal >= 15) {
      price = 0;
    }

    const addr = currentAddress || address;

    onShippingUpdate({
      zoneName: zone.name,
      methodName: mKey === 'standard' ? 'Standard Economy' : 'Priority Express',
      price: price,
      days: mKey === 'standard' ? zone.std_time : zone.exp_time,
      // Customer data for Stripe Customer creation
      customerName: addr.name,
      customerEmail: addr.email,
      customerAddress: {
        line1: addr.street,
        city: addr.city,
        state: addr.state,
        postal_code: addr.zip,
      },
    });
  };

  // Sync address data to parent whenever fields change (if zone is already selected)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (address.zone) {
      updateParent(address.zone, method, address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.name, address.email, address.street, address.city, address.state, address.zip]);

  return (
    <div className="shipping-stage-container">
      <div className="shipping-form-card">
        <h3>Contact & Shipping Address</h3>
        <div className="form-grid">
          <div className="form-group full">
            <label>Full Name</label>
            <input type="text" placeholder="John Doe" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} />
          </div>
          <div className="form-group full">
            <label>Email Address</label>
            <input type="email" placeholder="john@example.com" value={address.email} onChange={e => setAddress({...address, email: e.target.value})} />
          </div>
          <div className="form-group full">
            <label>Street Address</label>
            <input type="text" placeholder="123 Security St" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
          </div>
          <div className="form-group half">
            <label>City</label>
            <input type="text" placeholder="New York" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
          </div>
          <div className="form-group half">
            <label>State / Province</label>
            <input type="text" placeholder="NY" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} />
          </div>
          <div className="form-group half">
            <label>ZIP / Postal Code</label>
            <input type="text" placeholder="10001" value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} />
          </div>
          <div className="form-group full">
            <label>Shipping Region</label>
            <select value={address.zone} onChange={handleZoneChange}>
              <option value="">Select your region...</option>
              {Object.keys(shippingZones).map(key => (
                <option key={key} value={key}>{shippingZones[key].name}</option>
              ))}
            </select>
          </div>
        </div>

        {address.zone && (
          <div className="shipping-methods-section">
            <h3>Choose Shipping Method</h3>
            
            {address.zone !== 'domestic_eua' && (
              <div className="import-tax-notice">
                <p>⚠️ <strong>International Notice:</strong> Import duties, taxes, and brokerage fees are not included in the product price or shipping cost. These charges are the buyer's responsibility and are collected by your country's customs office.</p>
              </div>
            )}

            <div className={`method-card ${method === 'standard' ? 'active' : ''}`} onClick={() => handleMethodChange('standard')}>
              <div className="method-info">
                <strong>Standard Economy ({shippingZones[address.zone].std_time})</strong>
                <p>Reliable tracking included.</p>
              </div>
              <div className="method-price">
                {(shippingZones[address.zone].free_eligible && hardwareTotal >= 15) ? (
                  <span className="free-text">FREE</span>
                ) : (
                  `$${shippingZones[address.zone].standard.toFixed(2)}`
                )}
              </div>
            </div>

            <div className={`method-card ${method === 'express' ? 'active' : ''}`} onClick={() => handleMethodChange('express')}>
              <div className="method-info">
                <strong>Priority Express ({shippingZones[address.zone].exp_time})</strong>
                <p>Direct courier delivery with priority handling.</p>
              </div>
              <div className="method-price">
                ${shippingZones[address.zone].express.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
