import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req) {
  // Twilio sends data as incoming form-urlencoded
  const formData = await req.formData();
  // We can pass custom params via Client. If the SDK dials out, it sends params
  const tagId = formData.get('tagId');
  const callerId = process.env.TWILIO_PHONE_NUMBER;

  const twiml = new VoiceResponse();

  if (!tagId) {
    twiml.say("Error. Tag Identification missing.");
    return new Response(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Grab Tag to find Tag-Specific Phone or fallback to Owner Profile
    const { data: tag, error: tagErr } = await supabaseAdmin
      .from('tags')
      .select('user_id, phone')
      .eq('id', tagId)
      .single();

    if (tagErr || !tag) throw new Error("Tag not found.");

    let numberToDial = tag.phone;

    // Fallback: Check if the owner has a phone number registered globally if not on tag.
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('phone, plan') // Check plan level too
      .eq('id', tag.user_id)
      .single();

    if (!numberToDial && profile?.phone) {
      numberToDial = profile.phone;
    }

    if (!numberToDial) {
       twiml.say("The owner of this item has not registered a valid contact number. Please hang up and use the text chat.");
       return new Response(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    // Optional Check: Is the owner on Plus/Elite? (You can enforce this here based on your business rules)
    if (profile?.plan === 'starter') {
      // You can block or allow. Right now let's allow everyone but leave the logic block.
    }

    // Dial the physical number
    const dial = twiml.dial({ callerId: callerId, timeLimit: 180 }); // max 3 mins circuit breaker
    dial.number(numberToDial);

    return new Response(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error("Twilio Routing Error:", error);
    twiml.say("We encountered a system error connecting the call. Please try the text chat.");
    return new Response(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  }
}
