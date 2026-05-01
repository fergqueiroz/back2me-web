import { sendAdminSMS } from '@/lib/alerts';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, message } = await request.json();

    if (!email || !message) {
      return Response.json({ error: 'Email and message are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    await supabase.from('inquiries').insert({ email, message });

    await sendAdminSMS(
      `📩 Luxury Brand Inquiry\nFrom: ${email}\n\n${message}`
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Inquiry error:', err);
    return Response.json({ error: 'Failed to send inquiry' }, { status: 500 });
  }
}
