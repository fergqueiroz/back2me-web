import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { tagId, finderSessionId, chatSessionId, finderAddress, parcelSize } = await request.json();

    if (!tagId || !finderAddress) {
      return NextResponse.json({ error: 'Missing required shipment details' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Verify that the tag exists and get owner_id
    const { data: tag, error: tagErr } = await adminSupabase
      .from('tags')
      .select('user_id')
      .eq('id', tagId)
      .single();

    if (tagErr || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // 2. Check for an existing pending request
    const { data: existingShipment } = await adminSupabase
      .from('shipments')
      .select('id')
      .eq('tag_id', tagId)
      .eq('status', 'awaiting_owner_payment')
      .single();

    if (existingShipment) {
      // OVERWRITE the existing pending address instead of blocking them! 
      // This is great UX if they made a typo in their address.
      const { error: updateErr } = await adminSupabase
        .from('shipments')
        .update({ finder_address: { ...finderAddress, parcel_size: parcelSize || 'small' }, chat_session_id: chatSessionId || null })
        .eq('id', existingShipment.id);

      if (updateErr) {
        return NextResponse.json({ error: 'Failed to update existing request' }, { status: 500 });
      }

      return NextResponse.json({ success: true, shipmentId: existingShipment.id });
    }

    // 3. Create the Shipment Request
    const { data: shipment, error: insertError } = await adminSupabase
      .from('shipments')
      .insert({
        tag_id: tagId,
        owner_id: tag.user_id,
        chat_session_id: chatSessionId || null,
        finder_address: { ...finderAddress, parcel_size: parcelSize || 'small' },
        status: 'awaiting_owner_payment'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Shipment DB Error:', insertError);
      return NextResponse.json({ error: 'Failed to create shipment request' }, { status: 500 });
    }

    // Automatically send an alert message into the chat room if there's a chat session
    if (chatSessionId) {
      await adminSupabase.from('messages').insert({
         tag_id: tagId,
         chat_session_id: chatSessionId,
         is_system: true,
         content: "📦 The finder has offered to mail this item back to you! Please check your Owner Dashboard to review shipping rates and generate a prepaid label."
      });
    }

    return NextResponse.json({ success: true, shipmentId: shipment.id });

  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
