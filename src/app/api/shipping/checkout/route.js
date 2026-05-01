import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import EasyPostClient from '@easypost/api';
import { calculateMargin } from '@/config/shipping';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY);

// Fallback to localhost if APP_URL is not set
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const { shipmentId, easypostShipmentId, rateId, overrideDestination } = await request.json();

    if (!shipmentId || !easypostShipmentId || !rateId) {
      return NextResponse.json({ error: 'Missing shipment context identifiers.' }, { status: 400 });
    }

    // 1. Fetch the exact rate from EasyPost to confirm price
    const epShipment = await easypost.Shipment.retrieve(easypostShipmentId);
    const selectedRate = epShipment.rates.find(r => r.id === rateId);

    if (!selectedRate) {
      return NextResponse.json({ error: 'Selected rate is no longer valid or found.' }, { status: 404 });
    }

    // 2. Re-calculate margin to guarantee integrity
    const marginMath = calculateMargin(selectedRate.rate);

    // Translate rate to Stripe cents (e.g. 5.99 -> 599)
    const unitAmountCents = Math.round(marginMath.finalPrice * 100);

    // Provide a beautiful checkout experience for the owner
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: selectedRate.currency.toLowerCase() || 'usd',
            product_data: {
              name: `Return Shipping Label (${selectedRate.carrier} ${selectedRate.service})`,
              description: overrideDestination 
                ? `Pickup at: ${overrideDestination.name || overrideDestination.street1}` 
                : 'Prepaid PDF label delivery to finder.',
            },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'mail_it_back',
        b2m_shipment_id: shipmentId,
        easypost_shipment_id: easypostShipmentId,
        easypost_rate_id: rateId,
        carrier: selectedRate.carrier,
        base_cost: marginMath.baseCost.toString(),
        markup_amount: marginMath.markup.toString(),
        final_price: marginMath.finalPrice.toString(),
        override_destination: overrideDestination ? JSON.stringify(overrideDestination) : ''
      },
      success_url: `${APP_URL}/dashboard/tags?shipping_success=true`,
      cancel_url: `${APP_URL}/dashboard/tags`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error?.message || 'Unknown error';
    console.error('Stripe Checkout Error:', message, error);
    return NextResponse.json({ error: `Failed to create checkout session: ${message}` }, { status: 500 });
  }
}
