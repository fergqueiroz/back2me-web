import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("1. Finding a test user profile...");
  const { data: profile } = await supabase.from('profiles').select('*').limit(1).single();
  const userId = profile.id;
  console.log(`Using Profile ID: ${userId}`);

  console.log("2. Setting Owner Shipping Address...");
  await supabase.from('profiles').update({
    shipping_name: 'Owner Tester',
    shipping_street: '3412 NW 7th Ave',
    shipping_city: 'Miami',
    shipping_state: 'FL',
    shipping_zip: '33127',
    shipping_country: 'US'
  }).eq('id', userId);
  
  console.log("3. Finding an active tag...");
  const { data: tag, error: tagErr } = await supabase.from('tags').select('*').eq('user_id', userId).limit(1).single();
  
  if (!tag) {
    console.log("No tags found for user!");
    return;
  }
  console.log(`Using Tag ID: ${tag.id}`);

  console.log("4. Simulating Finder Requesting Shipping...");
  
  const payload = {
    tagId: tag.id,
    finderAddress: {
      name: "Finder Sam",
      street1: "111 Wall St",
      city: "New York",
      state: "NY",
      zip: "10005",
      country: "US"
    }
  };

  const req = await fetch('http://localhost:3000/api/shipping/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const res = await req.json();
  
  if (!req.ok) {
    console.error("Failed to create shipment:", res);
    return;
  }
  
  const shipmentId = res.shipmentId;
  console.log(`Created Shipment ID: ${shipmentId}`);
  
  console.log("5. Testing /api/shipping/rates...");
  const rateReq = await fetch('http://localhost:3000/api/shipping/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId })
  });
  const rateRes = await rateReq.json();
  
  if (!rateReq.ok) {
    console.error("Failed to fetch rates:", rateRes);
    return;
  }
  
  console.log(`Fetched Rates via EasyPost successfully! Found ${rateRes.rates.length} rates.`);
  console.log(`EasyPost Shipment ID: ${rateRes.easypostShipmentId}`);
  console.log("Topping List:", rateRes.rates[0]);

  console.log("E2E Setup Success! You can now test the Stripe URL generation...");
}
run();
