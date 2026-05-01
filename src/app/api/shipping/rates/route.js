import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import EasyPostClient from '@easypost/api';

import { calculateMargin, PARCEL_PRESETS, CARRIER_QR_SUPPORT } from '@/config/shipping';

const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY);

export async function POST(request) {
  try {
    const { shipmentId, overrideDestination } = await request.json();

    if (!shipmentId) {
      return NextResponse.json({ error: 'Missing shipmentId' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch Shipment and Owner Address
    const { data: shipment, error: shipErr } = await adminSupabase
      .from('shipments')
      .select('*, profiles:owner_id(shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country)')
      .eq('id', shipmentId)
      .single();

    if (shipErr || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // 2. Determine destination: Owner's home OR a pickup location
    let toAddress;

    if (overrideDestination && overrideDestination.street1) {
      // Pickup location mode
      toAddress = {
        name: overrideDestination.name || 'Pickup Location',
        street1: overrideDestination.street1,
        city: overrideDestination.city,
        state: overrideDestination.state,
        zip: overrideDestination.zip,
        country: 'US',
        phone: '0000000000'
      };
    } else {
      // Home delivery mode
      const ownerProfile = shipment.profiles;

      if (!ownerProfile.shipping_street || !ownerProfile.shipping_city) {
        return NextResponse.json({ 
          error: 'You must set up your Shipping Address in your Profile before calculating rates.' 
        }, { status: 400 });
      }

      toAddress = {
        name: ownerProfile.shipping_name || 'Owner',
        street1: ownerProfile.shipping_street,
        city: ownerProfile.shipping_city,
        state: ownerProfile.shipping_state,
        zip: ownerProfile.shipping_zip,
        country: ownerProfile.shipping_country || 'US',
        phone: ownerProfile.shipping_phone || '0000000000'
      };
    }

    const fromAddress = {
      name: shipment.finder_address.name || 'Finder',
      street1: shipment.finder_address.street1,
      street2: shipment.finder_address.street2,
      city: shipment.finder_address.city,
      state: shipment.finder_address.state,
      zip: shipment.finder_address.zip,
      country: shipment.finder_address.country || 'US',
      phone: shipment.finder_address.phone || '0000000000'
    };

    // Dynamic parcel size based on the Finder's selection
    const sizeKey = shipment.finder_address?.parcel_size || 'small';
    const preset = PARCEL_PRESETS[sizeKey] || PARCEL_PRESETS.small;
    const parcel = {
      length: preset.length,
      width: preset.width,
      height: preset.height,
      weight: preset.weight
    };

    // 3. Hit EasyPost API to Create Shipment and get Rates
    const epShipment = await easypost.Shipment.create({
      to_address: toAddress,
      from_address: fromAddress,
      parcel: parcel
    });

    // Save the EasyPost generic shipment ID to our DB so we can buy it later
    await adminSupabase
      .from('shipments')
      .update({ easypost_shipment_id: epShipment.id })
      .eq('id', shipment.id);

    // Filter and curate rates into exactly 3 options for the frontend
    const rawRates = epShipment.rates.map(rate => ({
      ...rate,
      parsedPrice: parseFloat(rate.rate)
    })).sort((a, b) => {
      // Primary: price ascending. Tiebreak: prefer QR-capable carriers
      if (a.parsedPrice !== b.parsedPrice) return a.parsedPrice - b.parsedPrice;
      const aQR = CARRIER_QR_SUPPORT[a.carrier]?.supportsQR ? 0 : 1;
      const bQR = CARRIER_QR_SUPPORT[b.carrier]?.supportsQR ? 0 : 1;
      return aQR - bQR;
    });

    let rates = [];

    if (rawRates.length > 0) {
      // 1. Budget: Cheapest (QR-capable preferred on tie)
      const budgetRaw = rawRates[0];

      // 2. Express: Fastest delivery (QR-capable preferred on tie)
      let expressRaw = [...rawRates].sort((a, b) => {
        const aDays = a.delivery_days || 99;
        const bDays = b.delivery_days || 99;
        if (aDays !== bDays) return aDays - bDays;
        const aQR = CARRIER_QR_SUPPORT[a.carrier]?.supportsQR ? 0 : 1;
        const bQR = CARRIER_QR_SUPPORT[b.carrier]?.supportsQR ? 0 : 1;
        if (aQR !== bQR) return aQR - bQR;
        return a.parsedPrice - b.parsedPrice; 
      })[0];

      // 3. Standard: Best mid-range option
      let standardRaw = rawRates.find(r => 
        r.id !== budgetRaw.id && 
        r.id !== expressRaw.id && 
        r.delivery_days && r.delivery_days <= 4
      );

      if (!standardRaw) {
        standardRaw = rawRates.find(r => r.id !== budgetRaw.id && r.id !== expressRaw.id);
      }

      // Safe deduplicate & map with margins, UX labels, and QR flag
      const curatedRates = [];
      const addCurated = (raw, label, daysLabel) => {
        if (!raw || curatedRates.some(r => r.id === raw.id)) return;
        
        const marginMath = calculateMargin(raw.rate);
        const qrSupport = CARRIER_QR_SUPPORT[raw.carrier];
        curatedRates.push({
          id: raw.id,
          carrier: raw.carrier,
          service: raw.service,
          ui_label: label,
          ui_delivery: daysLabel,
          rate: marginMath.finalPrice.toFixed(2),
          currency: raw.currency,
          qr_supported: qrSupport?.supportsQR || false,
        });
      };

      addCurated(budgetRaw, 'Budget', '3–5 days');
      
      if (standardRaw) {
        addCurated(standardRaw, 'Standard', '2–3 days');
      }
      
      if (expressRaw && expressRaw.id !== budgetRaw.id) {
        addCurated(expressRaw, 'Express', '1–2 days');
      }

      rates = curatedRates;
    }

    return NextResponse.json({ rates, easypostShipmentId: epShipment.id });

  } catch (error) {
    console.error('EasyPost Rate Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error calculating rates' }, { status: 500 });
  }
}
