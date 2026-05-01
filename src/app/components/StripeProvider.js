'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripeProvider({ clientSecret, children }) {
  if (!clientSecret) return children;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSizeBase: '15px',
        colorPrimary: '#F26522',
        colorBackground: '#FFFFFF',
        colorText: '#0A1F3F',
        colorDanger: '#E53935',
        borderRadius: '10px',
        spacingUnit: '4px',
        spacingGridRow: '16px',
      },
      rules: {
        '.Input': {
          border: '1.5px solid #E0E0E0',
          boxShadow: 'none',
          padding: '12px 14px',
          transition: 'border-color 0.2s ease',
        },
        '.Input:focus': {
          border: '1.5px solid #F26522',
          boxShadow: '0 0 0 3px rgba(242, 101, 34, 0.12)',
        },
        '.Label': {
          fontWeight: '600',
          fontSize: '13px',
          color: '#0A1F3F',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
        '.Tab': {
          border: '1.5px solid #E0E0E0',
          borderRadius: '10px',
          padding: '10px 16px',
        },
        '.Tab--selected': {
          border: '1.5px solid #F26522',
          backgroundColor: 'rgba(242, 101, 34, 0.04)',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
