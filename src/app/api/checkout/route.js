import Stripe from 'stripe';
import { sendAdminSMS } from '@/lib/alerts';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Track repeated checkout failures per email (resets on server restart)
// Map<email, { count: number, windowStart: number }>
const checkoutFailures = new Map();
const FAILURE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const FAILURE_ALERT_THRESHOLD = 3;

export async function POST(request) {
  let attemptEmail = null;

  try {
    const body = await request.json();
    const { items, plan, billingCycle, shippingInfo } = body;
    attemptEmail = shippingInfo?.customerEmail ?? null;

    // ── Validate required data ───────────────────────────────────
    if (!shippingInfo?.customerEmail || !shippingInfo?.customerName) {
      return Response.json(
        { error: 'Customer name and email are required' },
        { status: 400 }
      );
    }

    // ── Plan configuration ───────────────────────────────────────
    const planConfig = {
      starter: { name: 'Starter Kit — 3 Items', monthly: 490, yearly: 4900, limit: 3 },
      plus:    { name: 'Combo Plus — 6 Items',  monthly: 690, yearly: 6900, limit: 6 },
      elite:   { name: 'Elite 12 — 12 Items',   monthly: 990, yearly: 9900, limit: 12 },
    };

    const activePlan = planConfig[plan] || planConfig.starter;
    const interval = billingCycle === 'yearly' ? 'year' : 'month';
    const subscriptionAmount = activePlan[billingCycle === 'yearly' ? 'yearly' : 'monthly'];

    // ── Hardware items ───────────────────────────────────────────
    const hardwareItems = items.filter(item => item.quantity > 0);
    const hardwareTotal = hardwareItems.reduce(
      (sum, item) => sum + (Math.round(item.price * 100) * item.quantity), 0
    );

    // ── Extra items fee (beyond plan limit) ──────────────────────
    const totalItemsCount = hardwareItems.reduce((sum, item) => sum + item.quantity, 0);
    const extraItemsCount = Math.max(0, totalItemsCount - activePlan.limit);
    const extraFeePerUnit = billingCycle === 'yearly' ? 1000 : 100; // $10/yr or $1/mo per extra
    const totalExtraFee = extraItemsCount * extraFeePerUnit;

    // ── Shipping ─────────────────────────────────────────────────
    const shippingTotal = (shippingInfo.price > 0) 
      ? Math.round(shippingInfo.price * 100) 
      : 0;

    // ── 1. Create Stripe Customer ────────────────────────────────
    const customer = await stripe.customers.create({
      email: shippingInfo.customerEmail,
      name: shippingInfo.customerName,
      address: shippingInfo.customerAddress ? {
        line1: shippingInfo.customerAddress.line1 || '',
        city: shippingInfo.customerAddress.city || '',
        state: shippingInfo.customerAddress.state || '',
        postal_code: shippingInfo.customerAddress.postal_code || '',
        country: 'US', // Default; can be enhanced with zone mapping
      } : undefined,
      metadata: {
        source: 'back2me-checkout',
        plan,
        billingCycle,
      },
    });

    // ── 2. Add one-time invoice items (hardware + shipping) ──────
    // These get attached to the customer's next invoice (the subscription's first invoice)
    
    for (const item of hardwareItems) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: Math.round(item.price * 100) * item.quantity,
        currency: 'usd',
        description: `${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ''} — One-time`,
      });
    }

    if (shippingTotal > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: shippingTotal,
        currency: 'usd',
        description: `Shipping — ${shippingInfo.methodName} (${shippingInfo.zoneName}, ${shippingInfo.days})`,
      });
    }

    // ── 3. Build subscription items ──────────────────────────────
    // Stripe subscription price_data requires 'product' (ID), not 'product_data'.
    // Create the product first, then reference it.
    const planProduct = await stripe.products.create({
      name: `Back2Me ${activePlan.name}`,
      metadata: { plan_id: plan, type: 'subscription' },
    });

    const subscriptionItems = [
      {
        price_data: {
          currency: 'usd',
          product: planProduct.id,
          unit_amount: subscriptionAmount,
          recurring: { interval },
        },
        quantity: 1,
      },
    ];

    // Add extra items recurring fee if applicable
    if (extraItemsCount > 0) {
      const extraProduct = await stripe.products.create({
        name: `Extra Item Protection (${extraItemsCount} beyond ${activePlan.limit}-item limit)`,
        metadata: { type: 'extra_items' },
      });

      subscriptionItems.push({
        price_data: {
          currency: 'usd',
          product: extraProduct.id,
          unit_amount: extraFeePerUnit,
          recurring: { interval },
        },
        quantity: extraItemsCount,
      });
    }

    // ── 4. Create Subscription ───────────────────────────────────
    // payment_behavior: 'default_incomplete' → invoice is created but not paid yet
    // Use confirmation_secret (Stripe 2024+ API) to get the client_secret for payment
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: subscriptionItems,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.confirmation_secret'],
      metadata: {
        plan,
        billingCycle,
        hardwareTotal: hardwareTotal.toString(),
        shippingTotal: shippingTotal.toString(),
        itemsCount: totalItemsCount.toString(),
        extraItems: extraItemsCount.toString(),
      },
    });

    // ── 5. Extract client secret ─────────────────────────────────
    const invoice = subscription.latest_invoice;
    const clientSecret = invoice?.confirmation_secret?.client_secret;

    if (!clientSecret) {
      console.error('Subscription created but no client_secret:', {
        subscriptionId: subscription.id,
        invoiceId: invoice?.id,
        invoiceStatus: invoice?.status,
        confirmationSecret: invoice?.confirmation_secret,
      });
      throw new Error('Payment setup failed. Please try again.');
    }

    return Response.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      amount: invoice.amount_due,
    });

  } catch (err) {
    console.error('Stripe error:', err);

    // Track repeated checkout failures and alert admin after threshold
    if (attemptEmail) {
      const now = Date.now();
      const record = checkoutFailures.get(attemptEmail) ?? { count: 0, windowStart: now };

      if (now - record.windowStart > FAILURE_WINDOW_MS) {
        record.count = 0;
        record.windowStart = now;
      }

      record.count += 1;
      checkoutFailures.set(attemptEmail, record);

      if (record.count >= FAILURE_ALERT_THRESHOLD) {
        checkoutFailures.delete(attemptEmail); // reset so we don't spam
        await sendAdminSMS(
          `⚠️ Repeated failed checkout attempts\nEmail: ${attemptEmail}\nFailures in last hour: ${record.count}\nLast error: ${err.message}`
        ).catch(() => {}); // never block the response
      }
    }

    return Response.json(
      { error: err.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
