import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Link Marketing Session Conversion
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('b2m_session')?.value;
      if (sessionCookie) {
        // Run without awaiting to avoid blocking redirect
        supabase.from('marketing_sessions')
          .update({ converted_user_id: data.user.id })
          .eq('session_token', sessionCookie)
          .is('converted_user_id', null)
          .then();
      }

      return NextResponse.redirect(new URL(redirect, request.url));
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
