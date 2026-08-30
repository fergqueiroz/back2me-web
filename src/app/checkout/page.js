'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import OrderSummary from '../components/OrderSummary';
import Link from 'next/link';

import ShippingStage from '../components/ShippingStage';
import PaymentStage from '../components/PaymentStage';
import StripeProvider from '../components/StripeProvider';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'starter';
  const billingCycle = searchParams.get('billing') || 'monthly';
  const [step, setStep] = useState(1); // 1: Kit, 2: Shipping, 3: Payment
  const [shippingInfo, setShippingInfo] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  // Stripe state
  const [clientSecret, setClientSecret] = useState('');
  const [stripeError, setStripeError] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  const [stock, setStock] = useState({
    wristband_orange: 0,
    wristband_navy: 0,
    pettag_orange: 0,
    pettag_navy: 0,
    luggagetag_orange: 0,
    luggagetag_navy: 0,
    sticker_orange_small: 0,
    sticker_orange_large: 0,
    sticker_navy_small: 0,
    sticker_navy_large: 0,
  });

  useEffect(() => {
    setMounted(true);
    fetch('/api/inventory/stock')
      .then(res => res.json())
      .then(data => {
        if (data?.stock) setStock(data.stock);
      })
      .catch(console.error);
  }, []);

  const planData = {
    starter: { name: 'Starter Kit', limit: 3, monthlyPrice: '4.90', yearlyPrice: '49.00' },
    plus: { name: 'Combo Plus', limit: 6, monthlyPrice: '6.90', yearlyPrice: '69.00' },
    elite: { name: 'Elite 12', limit: 12, monthlyPrice: '9.90', yearlyPrice: '99.00' }
  };

  const activePlan = planData[planId] || planData.starter;

  const [quantities, setQuantities] = useState({
    wristband_orange: 0,
    wristband_navy: 0,
    pettag_orange: 0,
    pettag_navy: 0,
    luggagetag_orange: 0,
    luggagetag_navy: 0,
    sticker_orange_small: 0,
    sticker_orange_large: 0,
    sticker_navy_small: 0,
    sticker_navy_large: 0,
  });

  const updateQty = (id, delta) => {
    const maxAvailable = stock[id] ?? 0;
    setQuantities(prev => {
      const currentVal = prev[id] || 0;
      const newVal = currentVal + delta;
      if (newVal > maxAvailable) {
        alert(`This item is currently sold out or has reached available stock (${maxAvailable} available).`);
        return prev;
      }
      return {
        ...prev,
        [id]: Math.max(0, newVal)
      };
    });
  };

  const selectedItems = [
    { name: 'Wristband Orange', price: 5, quantity: quantities.wristband_orange },
    { name: 'Wristband Navy', price: 5, quantity: quantities.wristband_navy },
    { name: 'Pet Tag Orange', price: 5, quantity: quantities.pettag_orange },
    { name: 'Pet Tag Navy', price: 5, quantity: quantities.pettag_navy },
    { name: 'Luggage Tag Orange', price: 5, quantity: quantities.luggagetag_orange },
    { name: 'Luggage Tag Navy', price: 5, quantity: quantities.luggagetag_navy },
    { name: 'QR Sticker Orange', size: '1x1', price: 3, quantity: quantities.sticker_orange_small },
    { name: 'QR Sticker Orange', size: '2x2', price: 3, quantity: quantities.sticker_orange_large },
    { name: 'QR Sticker Navy', size: '1x1', price: 3, quantity: quantities.sticker_navy_small },
    { name: 'QR Sticker Navy', size: '2x2', price: 3, quantity: quantities.sticker_navy_large },
  ];

  const totalHardware = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = selectedItems.reduce((acc, item) => acc + item.quantity, 0);

  // ── Create PaymentIntent when entering Step 3 ─────────────────
  const initializePayment = async () => {
    setLoadingPayment(true);
    setStripeError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
          plan: planId,
          billingCycle,
          shippingInfo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      setClientSecret(data.clientSecret);
      setSubscriptionId(data.subscriptionId);
      setCustomerId(data.customerId);
      setStep(3);
    } catch (err) {
      setStripeError(err.message);
    } finally {
      setLoadingPayment(false);
    }
  };

  // ── Handle successful payment ─────────────────────────────────
  const handlePaymentSuccess = (intentId) => {
    setPaymentIntentId(intentId);
    setIsProcessing(false);
    setIsSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ProductCard = ({ title, type, id_orange, id_navy, price, hasSizes, id_orange_l, id_navy_l, imageNavy, imageOrange }) => {
    const [hoveredColor, setHoveredColor] = useState(null); // 'navy' or 'orange'

    const renderStockBadge = (itemId) => {
      const avail = stock[itemId] ?? 0;
      if (avail <= 0) {
        return <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#fee2e2', color: '#b91c1c', fontSize: '11px', fontWeight: 'bold', marginLeft: '6px' }}>SOLD OUT</span>;
      }
      return null;
    };

    return (
      <div className="checkout-product-card">
        <div className="product-visual-group">
          <div className="product-image-container">
            <img 
              src={imageNavy} 
              alt={title} 
              className={`img-navy ${(hoveredColor === 'orange') ? 'hidden' : 'visible'}`} 
            />
            <img 
              src={imageOrange} 
              alt={title} 
              className={`img-orange ${(hoveredColor === 'orange') ? 'visible' : 'hidden'}`} 
            />
          </div>
          <div className="product-info">
            <h3>{title}</h3>
            <span className="price-tag">${price}.00 each</span>
          </div>
        </div>
        
        <div className="product-selectors">
          <div 
            className="selector-group"
            onMouseEnter={() => setHoveredColor('orange')}
            onMouseLeave={() => setHoveredColor(null)}
          >
            <label>Vibrant Orange {!hasSizes && renderStockBadge(id_orange)}</label>
            {hasSizes ? (
              <div className="size-selectors">
                <div className="qty-control">
                  <span>1x1 in: {renderStockBadge(id_orange)}</span>
                  <button onClick={() => updateQty(id_orange, -1)}>-</button>
                  <input type="number" value={quantities[id_orange]} readOnly />
                  <button onClick={() => updateQty(id_orange, 1)} disabled={(stock[id_orange] ?? 0) <= 0 || quantities[id_orange] >= (stock[id_orange] ?? 0)}>+</button>
                </div>
                <div className="qty-control">
                  <span>2x2 in: {renderStockBadge(id_orange_l)}</span>
                  <button onClick={() => updateQty(id_orange_l, -1)}>-</button>
                  <input type="number" value={quantities[id_orange_l]} readOnly />
                  <button onClick={() => updateQty(id_orange_l, 1)} disabled={(stock[id_orange_l] ?? 0) <= 0 || quantities[id_orange_l] >= (stock[id_orange_l] ?? 0)}>+</button>
                </div>
              </div>
            ) : (
              <div className="qty-control">
                <button onClick={() => updateQty(id_orange, -1)}>-</button>
                <input type="number" value={quantities[id_orange]} readOnly />
                <button onClick={() => updateQty(id_orange, 1)} disabled={(stock[id_orange] ?? 0) <= 0 || quantities[id_orange] >= (stock[id_orange] ?? 0)}>+</button>
              </div>
            )}
          </div>

          <div 
            className="selector-group"
            onMouseEnter={() => setHoveredColor('navy')}
            onMouseLeave={() => setHoveredColor(null)}
          >
            <label>Navy Blue {!hasSizes && renderStockBadge(id_navy)}</label>
            {hasSizes ? (
              <div className="size-selectors">
                <div className="qty-control">
                  <span>1x1 in: {renderStockBadge(id_navy)}</span>
                  <button onClick={() => updateQty(id_navy, -1)}>-</button>
                  <input type="number" value={quantities[id_navy]} readOnly />
                  <button onClick={() => updateQty(id_navy, 1)} disabled={(stock[id_navy] ?? 0) <= 0 || quantities[id_navy] >= (stock[id_navy] ?? 0)}>+</button>
                </div>
                <div className="qty-control">
                  <span>2x2 in: {renderStockBadge(id_navy_l)}</span>
                  <button onClick={() => updateQty(id_navy_l, -1)}>-</button>
                  <input type="number" value={quantities[id_navy_l]} readOnly />
                  <button onClick={() => updateQty(id_navy_l, 1)} disabled={(stock[id_navy_l] ?? 0) <= 0 || quantities[id_navy_l] >= (stock[id_navy_l] ?? 0)}>+</button>
                </div>
              </div>
            ) : (
              <div className="qty-control">
                <button onClick={() => updateQty(id_navy, -1)}>-</button>
                <input type="number" value={quantities[id_navy]} readOnly />
                <button onClick={() => updateQty(id_navy, 1)} disabled={(stock[id_navy] ?? 0) <= 0 || quantities[id_navy] >= (stock[id_navy] ?? 0)}>+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  if (isSuccess) {
    return (
      <main className="checkout-page success-page">
        <div className="container narrow">
          <div className="success-content">
            <div className="success-lottie">🎉</div>
            <h1>Order Confirmed!</h1>
            <p className="order-id">Subscription: {subscriptionId ? subscriptionId.slice(-8).toUpperCase() : 'N/A'}</p>
            <div className="success-message">
              <h3>Thank you for joining our network of kindness.</h3>
              <p>Your {activePlan.name} is now being prepared. You will receive a tracking number at your email within 24 hours.</p>
            </div>
            
            <div className="next-steps">
              <h4>What&apos;s next?</h4>
              <ul>
                <li>Check your inbox for a confirmation email.</li>
                <li>Follow our instructions to activate your smart tags upon arrival.</li>
                <li>Share Back2Me Global with others to help build a safer world.</li>
              </ul>
            </div>

            <Link href="/" className="btn btn-navy">Back to Home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="container">
        <header className="checkout-header">
          {step === 1 ? (
             <Link href="/#pricing" className="back-link">← Back to Plans</Link>
          ) : (
            <button className="back-link no-btn" onClick={() => { if (step === 3) { setClientSecret(''); } setStep(step - 1); }}>← Back</button>
          )}
          
          <div className="logo-section">
            <span className="brand-back">Back2Me</span>
            <span className="brand-global">GLOBAL</span>
          </div>

          <div className="step-tracker">
            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>1. Build Your Kit</div>
            <div className={`step-arrow`}>→</div>
            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>2. Shipping & Address</div>
            <div className={`step-arrow`}>→</div>
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>3. Secure Payment</div>
          </div>

          <h1>
            {step === 1 && 'Build Your Safety Kit'}
            {step === 2 && 'Shipping Details'}
            {step === 3 && 'Secure Payment'}
          </h1>
          <p>
            {step === 1 && `Compose your ${activePlan.name} by choosing your preferred items and colors.`}
            {step === 2 && 'Tell us where to send your safety essentials.'}
            {step === 3 && 'Finalize your protection plan with Stripe\'s encrypted payment gateway.'}
          </p>
        </header>

        {stripeError && (
          <div className="payment-error" style={{ marginBottom: '24px' }}>
            <span className="error-icon">⚠️</span>
            {stripeError}
          </div>
        )}

        <div className="checkout-layout">
          <div className="checkout-main-content">
            {step === 1 && (
              <div className="product-selection-grid">
                <ProductCard 
                  title="Smart Wristbands" 
                  price={5} 
                  id_orange="wristband_orange" 
                  id_navy="wristband_navy" 
                  imageNavy="/products/bluewristband.jpeg"
                  imageOrange="/products/orangewristbandpng.png"
                />
                <ProductCard 
                  title="Smart Pet Tags" 
                  price={5} 
                  id_orange="pettag_orange" 
                  id_navy="pettag_navy" 
                  imageNavy="/products/bluepettag.png"
                  imageOrange="/products/orangepettag.png"
                />
                <ProductCard 
                  title="Smart Luggage Tags" 
                  price={5} 
                  id_orange="luggagetag_orange" 
                  id_navy="luggagetag_navy" 
                  imageNavy="/products/blueluggagetag.png"
                  imageOrange="/products/orangeluggagetag.png"
                />
                <ProductCard 
                  title="Smart QR Stickers" 
                  price={3} 
                  hasSizes={true}
                  id_orange="sticker_orange_small"
                  id_orange_l="sticker_orange_large"
                  id_navy="sticker_navy_small"
                  id_navy_l="sticker_navy_large"
                  imageNavy="/products/blueticker.png"
                  imageOrange="/products/orangesticker.png"
                />
                
                <div className="checkout-actions">
                  <button 
                    className="btn btn-navy" 
                    onClick={() => setStep(2)}
                    disabled={totalItems === 0}
                  >
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <ShippingStage 
                hardwareTotal={totalHardware} 
                onShippingUpdate={setShippingInfo} 
              />
            )}

            {step === 3 && clientSecret && (
              <StripeProvider clientSecret={clientSecret}>
                <PaymentStage 
                  onPaymentSuccess={handlePaymentSuccess}
                  processing={isProcessing}
                  setProcessing={setIsProcessing}
                />
              </StripeProvider>
            )}

            {step === 3 && !clientSecret && (
              <div className="payment-loading">
                <div className="spinner"></div>
                <p>Initializing secure payment...</p>
              </div>
            )}
          </div>

          <OrderSummary 
            planDetails={activePlan} 
            items={selectedItems} 
            billingCycle={billingCycle} 
            shippingInfo={shippingInfo}
            onProceed={step === 2 ? initializePayment : null}
            processing={isProcessing || loadingPayment}
            currentStep={step}
          />
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading configuration...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
