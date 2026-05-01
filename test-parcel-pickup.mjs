import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: shipment } = await supabase
    .from('shipments')
    .select('*')
    .eq('status', 'awaiting_owner_payment')
    .limit(1)
    .single();

  if (!shipment) {
    console.log('No pending shipment found.');
    return;
  }

  // Simulate finder chose 'medium' package
  await supabase.from('shipments').update({ 
    finder_address: { ...shipment.finder_address, parcel_size: 'medium' } 
  }).eq('id', shipment.id);

  console.log('=== Test 1: Home Delivery (medium package) ===');
  let res = await fetch('http://localhost:3000/api/shipping/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId: shipment.id })
  });
  let data = await res.json();
  if (!res.ok) { console.error('FAIL:', data); return; }
  console.log('Rates:', data.rates.length, 'options');
  data.rates.forEach(r => console.log(`  ${r.ui_label.padEnd(10)} | ${r.ui_delivery.padEnd(10)} | $${r.rate}`));

  console.log('');
  console.log('=== Test 2: Pickup Location Override ===');
  res = await fetch('http://localhost:3000/api/shipping/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      shipmentId: shipment.id, 
      overrideDestination: {
        name: 'UPS Store #4521',
        street1: '100 Broadway',
        city: 'New York',
        state: 'NY',
        zip: '10005'
      }
    })
  });
  data = await res.json();
  if (!res.ok) { console.error('FAIL:', data); return; }
  console.log('Rates:', data.rates.length, 'options');
  data.rates.forEach(r => console.log(`  ${r.ui_label.padEnd(10)} | ${r.ui_delivery.padEnd(10)} | $${r.rate}`));

  console.log('');
  console.log('ALL TESTS PASSED');
}

run();
