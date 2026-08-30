import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { qrCode, assignedTo, category, ownerMessage, medicalInfo, photoUrl, phone } = await request.json();

    if (!qrCode) {
      return NextResponse.json({ error: 'QR Code is required' }, { status: 400 });
    }

    // 1. Get current authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Use admin client to bypass RLS for checking and updating the unregistered tag
    const adminSupabase = createAdminClient();

    // Check if tag exists and is unregistered
    const { data: tag, error: tagError } = await adminSupabase
      .from('tags')
      .select('*')
      .eq('qr_code', qrCode.toUpperCase().trim())
      .single();

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Invalid QR Code. Please check the code on your tag.' }, { status: 404 });
    }

    const unactivatedStatuses = ['unregistered', 'generated', 'manufactured', 'in_stock', 'sold'];
    if (!unactivatedStatuses.includes(tag.status)) {
      return NextResponse.json({ error: 'This tag has already been activated.' }, { status: 400 });
    }

    // Check user's tag limit
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('tag_limit')
      .eq('id', user.id)
      .single();

    const { count: activeCount } = await adminSupabase
      .from('tags')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (profile && activeCount >= profile.tag_limit) {
      return NextResponse.json(
        { error: `You have reached your limit of ${profile.tag_limit} active tags on your current plan.` },
        { status: 403 }
      );
    }

    // 3. Activate the tag
    const { data: updatedTag, error: updateError } = await adminSupabase
      .from('tags')
      .update({
        user_id: user.id,
        status: 'active',
        assigned_to: assignedTo || null,
        category: category || null,
        owner_message: ownerMessage || null,
        medical_info: medicalInfo || null,
        photo_url: photoUrl || null,
        phone: phone || null,
        activated_at: new Date().toISOString()
      })
      .eq('id', tag.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to activate tag:', updateError);
      return NextResponse.json({ error: 'Failed to activate tag' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tag: updatedTag });

  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
