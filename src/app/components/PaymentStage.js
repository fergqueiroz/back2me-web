'use client';

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function PaymentStage({ onPaymentSuccess, processing, setProcessing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState('');
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message);
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess(paymentIntent.id);
    } else {
      // Payment requires additional action or redirect happened
      setProcessing(false);
    }
  };

  return (
    <div className="payment-stage-container">
      <form onSubmit={handleSubmit} id="stripe-payment-form">
        <div className="stripe-element-wrapper">
          <PaymentElement 
            onReady={() => setIsReady(true)}
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              business: {
                name: 'Back2Me Global',
              },
            }}
          />
        </div>

        {errorMessage && (
          <div className="payment-error">
            <span className="error-icon">⚠️</span>
            {errorMessage}
          </div>
        )}

        <div className="security-badges">
          <div className="badge">
            <span className="lock-icon">🔒</span>
            Encrypted SSL Connection
          </div>
          <div className="badge">
            <span className="pci-icon">🛡️</span>
            PCI-DSS Compliant via Stripe
          </div>
        </div>

        <button 
          type="submit"
          className={`btn btn-orange w-full stripe-pay-btn ${processing ? 'loading' : ''}`}
          disabled={!stripe || !elements || !isReady || processing}
        >
          {processing ? (
            <span className="btn-loading-content">
              <span className="spinner"></span>
              Processing Payment...
            </span>
          ) : (
            'Complete Secure Payment'
          )}
        </button>
      </form>
    </div>
  );
}
