import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('=== SHIPPING DIAGNOSTICS ===\n');

  // 1. Check for the most recent shipment
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('DB Error:', error);
    return;
  }

  if (!shipments?.length) {
    console.log('❌ No shipments found in database.');
    return;
  }

  for (const s of shipments) {
    console.log(`── Shipment: ${s.id} ──`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Tag ID: ${s.tag_id}`);
    console.log(`   Owner ID: ${s.owner_id}`);
    console.log(`   EasyPost Shipment ID: ${s.easypost_shipment_id || '❌ MISSING'}`);
    console.log(`   Tracking Code: ${s.tracking_code || '❌ MISSING'}`);
    console.log(`   Label URL: ${s.label_url || '❌ MISSING'}`);
    console.log(`   Stripe Payment: ${s.stripe_payment_intent_id || '❌ MISSING'}`);
    console.log(`   Base Cost: ${s.base_cost ?? '❌ NULL'}`);
    console.log(`   Markup:    ${s.markup_amount ?? '❌ NULL'}`);
    console.log(`   Final:     ${s.final_price ?? '❌ NULL'}`);
    console.log(`   Chat Session: ${s.chat_session_id || 'none'}`);
    console.log(`   Finder Address: ${JSON.stringify(s.finder_address)}`);
    console.log('');
  }

  // 2. Check if EasyPost key works
  console.log('── EasyPost API Key ──');
  const epKey = process.env.EASYPOST_API_KEY;
  if (!epKey) {
    console.log('❌ EASYPOST_API_KEY is not set!');
  } else {
    console.log(`   Key starts with: ${epKey.substring(0, 10)}...`);
    console.log(`   Key type: ${epKey.startsWith('EZTK') ? '✅ TEST key' : '⚠️ May be LIVE key'}`);
    
    // Try a basic EasyPost call
    try {
      const EasyPostClient = (await import('@easypost/api')).default;
      const easypost = new EasyPostClient(epKey);
      
      const latestWithEP = shipments.find(s => s.easypost_shipment_id);
      if (latestWithEP) {
        console.log(`   Trying to retrieve EP shipment: ${latestWithEP.easypost_shipment_id}`);
        const ep = await easypost.Shipment.retrieve(latestWithEP.easypost_shipment_id);
        console.log(`   ✅ EasyPost connection works!`);
        console.log(`   EP Status: ${ep.status}`);
        console.log(`   EP Rates: ${ep.rates?.length || 0} available`);
        if (ep.selected_rate) {
          console.log(`   Selected Rate: ${ep.selected_rate.carrier} ${ep.selected_rate.service} $${ep.selected_rate.rate}`);
        }
        if (ep.tracking_code) {
          console.log(`   EP Tracking: ${ep.tracking_code}`);
        }
        if (ep.postage_label?.label_url) {
          console.log(`   EP Label URL: ${ep.postage_label.label_url}`);
        }
      } else {
        console.log('   ⚠️ No shipment has an easypost_shipment_id to test with');
      }
    } catch (epErr) {
      console.error('   ❌ EasyPost Error:', epErr.message || epErr);
    }
  }

  // 3. Check Stripe webhook events
  console.log('\n── Stripe Check ──');
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const events = await stripe.events.list({ limit: 5, type: 'checkout.session.completed' });
    console.log(`   Recent checkout.session.completed events: ${events.data.length}`);
    
    for (const evt of events.data) {
      const meta = evt.data?.object?.metadata;
      console.log(`   - ${evt.id} | type=${meta?.type || 'unknown'} | shipment=${meta?.b2m_shipment_id || 'n/a'}`);
    }
  } catch (stripeErr) {
    console.error('   ❌ Stripe Error:', stripeErr.message);
  }

  console.log('\n=== DIAGNOSTICS COMPLETE ===');
}

diagnose();
