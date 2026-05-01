import twilio from 'twilio';

export async function POST(req) {
  try {
    const body = await req.json();
    const identity = body.identity || `finder_${Date.now()}`;

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: false, 
    });

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity: identity, ttl: 3600 }
    );

    token.addGrant(voiceGrant);

    return Response.json({ token: token.toJwt(), identity });
  } catch (err) {
    console.error("Twilio Token Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
