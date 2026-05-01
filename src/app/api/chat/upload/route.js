import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tagId = formData.get('tagId');
    const finderSessionId = formData.get('finderSessionId');

    if (!file || !tagId || !finderSessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Verify session is active
    const { data: session } = await adminSupabase
      .from('chat_sessions')
      .select('status')
      .eq('tag_id', tagId)
      .eq('finder_session_id', finderSessionId)
      .single();

    if (session && session.status === 'closed') {
      return NextResponse.json({ error: 'Session is closed' }, { status: 403 });
    }

    // Upload to 'chat-photos' bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${tagId}_${finderSessionId.substring(0,8)}_${Date.now()}.${fileExt}`;
    
    // File must be array buffer for supabase storage in Node edge
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await adminSupabase.storage
      .from('chat-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = adminSupabase.storage
      .from('chat-photos')
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });

  } catch (error) {
    console.error('Chat photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
