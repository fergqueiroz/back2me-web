import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { shipmentId } = await params;
    const adminSupabase = createAdminClient();

    const { data: shipment, error } = await adminSupabase
      .from('shipments')
      .select('tracking_code, label_url, status')
      .eq('id', shipmentId)
      .single();

    if (error || !shipment || !shipment.tracking_code) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    // Determine carrier from EasyPost shipment data (stored in our record)
    // We'll also check what carrier is associated
    const { data: fullShipment } = await adminSupabase
      .from('shipments')
      .select('easypost_shipment_id')
      .eq('id', shipmentId)
      .single();

    let carrier = 'USPS'; // default
    if (fullShipment?.easypost_shipment_id) {
      try {
        const EasyPostClient = (await import('@easypost/api')).default;
        const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY);
        const ep = await easypost.Shipment.retrieve(fullShipment.easypost_shipment_id);
        if (ep.selected_rate?.carrier) {
          carrier = ep.selected_rate.carrier;
        }
      } catch (e) {
        console.log('[Label API] Could not fetch carrier from EasyPost, using default');
      }
    }

    return NextResponse.json({
      tracking_code: shipment.tracking_code,
      label_url: shipment.label_url,
      status: shipment.status,
      carrier
    });
  } catch (err) {
    console.error('[Label API] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
