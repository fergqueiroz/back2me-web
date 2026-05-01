import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import EasyPostClient from '@easypost/api';

const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY);

export async function POST(request) {
  try {
    const rawBody = await request.text();

    // In production, you would verify the EasyPost webhook signature here.
    // For now, we will just parse it securely.
    const event = JSON.parse(rawBody);

    if (event.description === 'tracker.updated') {
      const tracker = event.result;
      const trackingCode = tracker.tracking_code;
      const status = tracker.status; // 'unknown', 'pre_transit', 'in_transit', 'out_for_delivery', 'delivered', 'available_for_pickup', 'return_to_sender', 'failure', 'cancelled', 'error'

      let back2meStatus = 'label_generated';
      if (['in_transit', 'out_for_delivery'].includes(status)) {
        back2meStatus = 'in_transit';
      } else if (status === 'delivered') {
        back2meStatus = 'delivered';
      }

      if (back2meStatus !== 'label_generated') {
        const adminClient = createAdminClient();
        await adminClient
          .from('shipments')
          .update({ status: back2meStatus })
          .eq('tracking_code', trackingCode);
          
        console.log(`[EasyPost Webhook] Updated tracking ${trackingCode} to ${back2meStatus}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[EasyPost Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
