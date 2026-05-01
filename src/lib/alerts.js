import twilio from 'twilio';

/**
 * Send an SMS to the admin phone number.
 * Silently no-ops if any required env var is missing so callers
 * never need to guard against missing config.
 */
export async function sendAdminSMS(message) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ADMIN_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || !ADMIN_PHONE_NUMBER) {
    console.warn('[Alerts] SMS skipped — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ADMIN_PHONE_NUMBER');
    return;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `[Back2Me Alert]\n${message}`,
    from: TWILIO_PHONE_NUMBER,
    to: ADMIN_PHONE_NUMBER,
  });
}
