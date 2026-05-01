import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import EasyPostClient from '@easypost/api';
import { sendAdminSMS } from '@/lib/alerts';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ── Disable Next.js body parsing — Stripe needs the raw body ──
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let event;

  // ── 1. Verify webhook signature ────────────────────────────────
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      // In development without CLI, skip verification but log warning
      console.warn('[Webhook] ⚠️ STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
      event = JSON.parse(rawBody);
    } else {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
  } catch (err) {
    console.error(`[Webhook] ⚠️ Signature verification failed: ${err.message}`);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── 2. Route events to handlers ────────────────────────────────
  try {
    switch (event.type) {
      // ━━━ SUBSCRIPTION LIFECYCLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.paused':
        await handleSubscriptionPaused(event.data.object);
        break;

      case 'customer.subscription.resumed':
        await handleSubscriptionResumed(event.data.object);
        break;

      // ━━━ CHECKOUT SESSION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      // ━━━ INVOICE / PAYMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object);
        break;

      // ━━━ CUSTOMER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object);
        break;

      // ━━━ DISPUTES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      // ━━━ PAYMENT METHOD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      case 'payment_method.attached':
        logEvent('Payment method attached', event.data.object);
        break;

      // ━━━ UNHANDLED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (err) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    // Return 200 anyway — Stripe will retry on 500, and we don't want
    // retries for application errors (only for transient failures)
    return Response.json({ received: true, error: err.message });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENT HANDLERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Subscription Created ─────────────────────────────────────────
async function handleSubscriptionCreated(subscription) {
  const { id, customer, status, metadata } = subscription;

  logEvent('🆕 Subscription created', {
    subscriptionId: id,
    customerId: customer,
    status,
    plan: metadata?.plan,
    billingCycle: metadata?.billingCycle,
    itemsCount: metadata?.itemsCount,
  });

  // TODO: When database is added:
  // 1. Create/update user record with customerId
  // 2. Create order record with subscription details
  // 3. Set initial tag limits based on plan
  // 4. Trigger fulfillment (ship hardware)
  // 5. Send welcome email
}

// ── Subscription Updated (plan change, status change) ────────────
async function handleSubscriptionUpdated(subscription) {
  const { id, customer, status, cancel_at_period_end, metadata, items } = subscription;

  const planItem = items?.data?.[0];
  const currentAmount = planItem?.price?.unit_amount;

  logEvent('🔄 Subscription updated', {
    subscriptionId: id,
    customerId: customer,
    status,
    cancelAtPeriodEnd: cancel_at_period_end,
    currentAmountCents: currentAmount,
    plan: metadata?.plan,
  });

  // TODO: When database is added:
  // 1. Update subscription status in DB
  // 2. If plan changed → update tag limits
  // 3. If cancel_at_period_end → mark for future cancellation
  // 4. If status went from 'incomplete' to 'active' → activate service
  // 5. Send plan change confirmation email

  if (status === 'active' && !cancel_at_period_end) {
    console.log(`[Webhook] ✅ Subscription ${id} is active`);
  }

  if (cancel_at_period_end) {
    console.log(`[Webhook] ⚠️ Subscription ${id} will cancel at period end`);
  }
}

// ── Subscription Deleted (cancelled or expired) ──────────────────
async function handleSubscriptionDeleted(subscription) {
  const { id, customer, status, metadata } = subscription;

  logEvent('🛑 Subscription deleted', {
    subscriptionId: id,
    customerId: customer,
    status,
    plan: metadata?.plan,
  });

  // TODO: When database is added:
  // 1. Mark subscription as cancelled in DB
  // 2. Deactivate all smart tags for this customer
  // 3. Revoke access to protected features
  // 4. Send cancellation confirmation + winback email
  // 5. Log churn event for analytics
}

// ── Subscription Paused ──────────────────────────────────────────
async function handleSubscriptionPaused(subscription) {
  logEvent('⏸️ Subscription paused', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  });

  // TODO: Temporarily deactivate tags, send re-activation email
}

// ── Subscription Resumed ─────────────────────────────────────────
async function handleSubscriptionResumed(subscription) {
  logEvent('▶️ Subscription resumed', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  });

  // TODO: Reactivate tags, send welcome back email
}

// Amounts above this threshold trigger an "unusually high payment" alert (in cents)
const HIGH_PAYMENT_THRESHOLD_CENTS = 50000; // $500

// ── Invoice Payment Succeeded (recurring charge went through) ────
async function handlePaymentSucceeded(invoice) {
  const { id, customer, subscription, amount_paid, billing_reason, hosted_invoice_url } = invoice;

  logEvent('💰 Payment succeeded', {
    invoiceId: id,
    customerId: customer,
    subscriptionId: subscription,
    amountPaid: `$${(amount_paid / 100).toFixed(2)}`,
    billingReason: billing_reason,
    // billing_reason values:
    // 'subscription_create' — first payment
    // 'subscription_cycle'  — recurring payment
    // 'subscription_update' — plan change
  });

  // SMS alert for unusually high payment amount
  if (amount_paid >= HIGH_PAYMENT_THRESHOLD_CENTS) {
    await sendAdminSMS(
      `🚨 Unusually high payment: $${(amount_paid / 100).toFixed(2)}\nCustomer: ${customer}\nSubscription: ${subscription}\nReason: ${billing_reason}`
    );
  }

  // TODO: When database is added:
  // 1. Record payment in transaction history
  // 2. Update subscription status to 'active'
  // 3. Extend service period
  // 4. If billing_reason === 'subscription_create' → trigger fulfillment
  // 5. Send receipt email with hosted_invoice_url

  if (billing_reason === 'subscription_create') {
    console.log(`[Webhook] 🎉 First payment! Trigger hardware fulfillment for customer ${customer}`);
  } else if (billing_reason === 'subscription_cycle') {
    console.log(`[Webhook] 🔁 Recurring payment of $${(amount_paid / 100).toFixed(2)} received`);
  }
}

// ── Invoice Payment Failed (card declined, expired, etc) ─────────
async function handlePaymentFailed(invoice) {
  const { id, customer, subscription, amount_due, attempt_count, next_payment_attempt, hosted_invoice_url } = invoice;

  logEvent('❌ Payment FAILED', {
    invoiceId: id,
    customerId: customer,
    subscriptionId: subscription,
    amountDue: `$${(amount_due / 100).toFixed(2)}`,
    attemptCount: attempt_count,
    nextRetry: next_payment_attempt
      ? new Date(next_payment_attempt * 1000).toISOString()
      : 'NO MORE RETRIES',
  });

  const nextRetryStr = next_payment_attempt
    ? new Date(next_payment_attempt * 1000).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC'
    : 'No more retries — subscription will be cancelled';

  // SMS on every payment failure
  await sendAdminSMS(
    `❌ Payment failed\nCustomer: ${customer}\nAmount: $${(amount_due / 100).toFixed(2)}\nAttempt #${attempt_count}\nNext retry: ${nextRetryStr}`
  );

  // Additional SMS when failures keep repeating (attempt 2+)
  if (attempt_count >= 2) {
    await sendAdminSMS(
      `⚠️ Repeated failed payment — attempt #${attempt_count}\nCustomer: ${customer}\nSubscription: ${subscription}\nAmount: $${(amount_due / 100).toFixed(2)}`
    );
  }

  // TODO: When database is added:
  // 1. Mark account as "payment_failed" in DB
  // 2. If attempt_count >= 3 → restrict features
  // 3. Send custom failure email with update-card link
  // 4. Create internal alert for support team
  // 5. If no next_payment_attempt → subscription will be cancelled soon

  if (!next_payment_attempt) {
    console.log(`[Webhook] 🚨 FINAL ATTEMPT FAILED for subscription ${subscription}. Will be cancelled.`);
  } else {
    console.log(`[Webhook] ⚠️ Payment attempt ${attempt_count} failed. Retrying at ${new Date(next_payment_attempt * 1000).toISOString()}`);
  }
}

// ── Invoice Finalized (ready to be paid) ─────────────────────────
async function handleInvoiceFinalized(invoice) {
  logEvent('📄 Invoice finalized', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: `$${(invoice.amount_due / 100).toFixed(2)}`,
    hostedUrl: invoice.hosted_invoice_url,
  });
}

// ── Customer Updated ─────────────────────────────────────────────
async function handleCustomerUpdated(customer) {
  logEvent('👤 Customer updated', {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
  });

  // TODO: Sync customer data changes to your DB
}

// ── Checkout Session Completed ───────────────────────────────────
async function handleCheckoutSessionCompleted(session) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[Webhook] 🛒 CHECKOUT SESSION COMPLETED');
  console.log('[Webhook] Session ID:', session.id);
  console.log('[Webhook] Payment Status:', session.payment_status);
  console.log('[Webhook] Metadata:', JSON.stringify(session.metadata));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (session.metadata?.type !== 'mail_it_back') {
    console.log('[Webhook] ⏩ Not a mail_it_back checkout — skipping');
    return;
  }

  console.log('[Webhook] ✅ Step 1: mail_it_back identified');

  const { b2m_shipment_id, easypost_shipment_id, easypost_rate_id, base_cost, markup_amount, final_price, carrier, override_destination } = session.metadata;

  console.log('[Webhook] b2m_shipment_id:', b2m_shipment_id);
  console.log('[Webhook] easypost_shipment_id:', easypost_shipment_id);
  console.log('[Webhook] easypost_rate_id:', easypost_rate_id);

  if (!b2m_shipment_id || !easypost_shipment_id || !easypost_rate_id) {
    console.error('[Webhook] ❌ ABORT: Missing required metadata');
    return;
  }

  let shipmentToBuy = easypost_shipment_id;
  let rateToBuy = easypost_rate_id;

  if (override_destination && override_destination.trim() !== '') {
    console.log('[Webhook] 📍 Pickup override detected');
    try {
      const pickupAddr = JSON.parse(override_destination);
      const orig = await easypost.Shipment.retrieve(easypost_shipment_id);
      const newShip = await easypost.Shipment.create({
        from_address: orig.from_address,
        to_address: { name: pickupAddr.name || 'Pickup', street1: pickupAddr.street1, city: pickupAddr.city, state: pickupAddr.state, zip: pickupAddr.zip, country: 'US' },
        parcel: orig.parcel
      });
      const match = newShip.rates.find(r => r.carrier === carrier && r.service === orig.rates.find(or => or.id === easypost_rate_id)?.service);
      if (match) { shipmentToBuy = newShip.id; rateToBuy = match.id; }
      else {
        const fb = newShip.rates.filter(r => r.carrier === carrier).sort((a,b) => parseFloat(a.rate) - parseFloat(b.rate))[0];
        if (fb) { shipmentToBuy = newShip.id; rateToBuy = fb.id; }
      }
    } catch (e) { console.error('[Webhook] Pickup error:', e.message); }
  }

  console.log('[Webhook] ✅ Step 2: Buying label...', shipmentToBuy, rateToBuy);
  let bought;
  try {
    bought = await easypost.Shipment.buy(shipmentToBuy, rateToBuy);
    console.log('[Webhook] ✅ Step 3: Label bought! Tracking:', bought.tracking_code);
  } catch (buyErr) {
    console.error('[Webhook] ❌ EASYPOST BUY FAILED:', buyErr.message);
    console.error('[Webhook] EasyPost error detail:', JSON.stringify(buyErr, Object.getOwnPropertyNames(buyErr), 2));
    return;
  }

  const trackingCode = bought.tracking_code;
  const labelUrl = bought.postage_label?.label_url;
  console.log('[Webhook] Label URL:', labelUrl);

  console.log('[Webhook] ✅ Step 4: Updating DB...');
  const adminClient = createAdminClient();

  const updateData = { stripe_payment_intent_id: session.payment_intent, tracking_code: trackingCode, label_url: labelUrl, status: 'label_generated' };
  try {
    if (base_cost) updateData.base_cost = parseFloat(base_cost);
    if (markup_amount) updateData.markup_amount = parseFloat(markup_amount);
    if (final_price) updateData.final_price = parseFloat(final_price);
  } catch (e) { /* ignore */ }

  console.log('[Webhook] Payload:', JSON.stringify(updateData));

  let { data: dbShipment, error: updateError } = await adminClient.from('shipments').update(updateData).eq('id', b2m_shipment_id).select().single();

  if (updateError) {
    console.error('[Webhook] ⚠️ Update failed:', JSON.stringify(updateError));
    console.log('[Webhook] Retrying without financial columns...');
    const { data: r, error: re } = await adminClient.from('shipments').update({ stripe_payment_intent_id: session.payment_intent, tracking_code: trackingCode, label_url: labelUrl, status: 'label_generated' }).eq('id', b2m_shipment_id).select().single();
    dbShipment = r;
    updateError = re;
  }

  if (updateError) {
    console.error('[Webhook] ❌ DB FAILED:', JSON.stringify(updateError));
    return;
  }

  console.log('[Webhook] ✅ Step 5: DB updated to label_generated');

  if (dbShipment?.chat_session_id) {
    console.log('[Webhook] ✅ Step 6: Sending chat msg...');
    const qrPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scan/label/${b2m_shipment_id}`;
    const { error: msgErr } = await adminClient.from('messages').insert({
      tag_id: dbShipment.tag_id, chat_session_id: dbShipment.chat_session_id, is_system: true,
      content: `🎉 The owner has prepaid for return shipping!\n\nTracking: ${trackingCode}\n\n📱 No printer? Show this QR code at any ${carrier || 'carrier'} location:\n${qrPageUrl}\n\n🖨️ Or download and print the label:\n${labelUrl}`
    });
    if (msgErr) console.error('[Webhook] ⚠️ Chat msg error:', msgErr);
    else console.log('[Webhook] ✅ Chat msg sent!');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[Webhook] 🎉 COMPLETE: ${b2m_shipment_id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ── Dispute Created ───────────────────────────────────────────────
async function handleDisputeCreated(dispute) {
  const { id, charge, amount, currency, reason, status } = dispute;

  logEvent('🚨 Dispute CREATED', {
    disputeId: id,
    chargeId: charge,
    amount: `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`,
    reason,
    status,
  });

  await sendAdminSMS(
    `🚨 Dispute created\nDispute: ${id}\nCharge: ${charge}\nAmount: $${(amount / 100).toFixed(2)} ${currency.toUpperCase()}\nReason: ${reason}\nStatus: ${status}`
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function logEvent(label, data) {
  console.log(`[Webhook] ${label}`, JSON.stringify(data, null, 2));
}
