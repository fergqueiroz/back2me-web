'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function MarketingTracker() {
  useEffect(() => {
    const trackSession = async () => {
      // 1. Check if session cookie already exists
      const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('b2m_session='));
      if (sessionCookie) return; // Already tracked

      // 2. Generate a new session token
      const sessionToken = crypto.randomUUID();
      
      // Calculate Expiration (30 days)
      const d = new Date();
      d.setTime(d.getTime() + (30*24*60*60*1000));
      document.cookie = `b2m_session=${sessionToken};expires=${d.toUTCString()};path=/`;

      // 3. Gather UTMs & Ref
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');
      const referrer = document.referrer;

      // Determine Channel
      let channel = 'Direct';
      if (utmSource) {
        channel = utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
      } else if (referrer) {
        if (referrer.includes('google.com')) channel = 'Google';
        else if (referrer.includes('chatgpt.com') || referrer.includes('openai.com')) channel = 'ChatGPT';
        else if (referrer.includes('facebook.com') || referrer.includes('instagram.com')) channel = 'Social';
        else channel = 'Referral';
      }

      // 4. Insert into database
      const supabase = createClient();
      await supabase.from('marketing_sessions').insert({
        session_token: sessionToken,
        channel,
        referrer,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign
      });
    };

    trackSession();
  }, []);

  return null; // Invisible component
}
