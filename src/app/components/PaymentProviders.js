'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentProviders({ children }) {
  const paypalOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb",
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </PayPalScriptProvider>
  );
}
