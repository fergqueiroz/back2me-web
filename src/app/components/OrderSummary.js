'use client';

export default function OrderSummary({ planDetails, items, billingCycle, shippingInfo, onProceed, processing, currentStep }) {
  const hardwareTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const extraItemsCount = Math.max(0, totalItemsCount - planDetails.limit);
  const extraFeePerUnit = billingCycle === 'monthly' ? 1.0 : 10.0;
  const totalExtraFee = extraItemsCount * extraFeePerUnit;
  
  const baseSubscription = billingCycle === 'monthly' ? planDetails.monthlyPrice : planDetails.yearlyPrice;
  const recurringTotal = parseFloat(baseSubscription) + totalExtraFee;
  
  const shippingCost = shippingInfo ? shippingInfo.price : 0;
  const initialTotal = hardwareTotal + shippingCost + recurringTotal;

  // Determine button text and visibility
  // Step 3: Payment button is inside PaymentStage, so hide the sidebar button
  const showButton = currentStep !== 3;
  let buttonLabel = 'Complete Information';
  if (onProceed) {
    buttonLabel = processing ? 'Setting up payment...' : 'Proceed to Secure Payment →';
  }

  return (
    <div className="order-summary-sidebar">
      <div className="summary-card">
        <h3>Order Summary</h3>
        
        <div className="summary-section">
          <div className="summary-row">
            <span>Selected Plan:</span>
            <strong>{planDetails.name}</strong>
          </div>
          <div className="summary-row">
            <span>Billing Cycle:</span>
            <span className="capitalize">{billingCycle}</span>
          </div>
          <div className="summary-row">
            <span>Coverage:</span>
            <span>{planDetails.limit} items covered</span>
          </div>
        </div>

        {/* Hardware Costs */}
        <div className="summary-section">
          <div className="summary-row highlight">
            <span>One-time Payment (Hardware)</span>
          </div>
          {items.map((item, i) => item.quantity > 0 && (
            <div key={i} className="summary-row sub">
              <span>{item.quantity}x {item.name} {item.size ? `(${item.size})` : ''}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-row sub">
            <span>Shipping</span>
            <span>
              {!shippingInfo ? (
                <em style={{fontSize: '0.8rem'}}>Calculated at next step</em>
              ) : (
                shippingInfo.price === 0 ? <strong className="free">FREE</strong> : `$${shippingInfo.price.toFixed(2)}`
              )}
            </span>
          </div>
          {shippingInfo && (
            <div className="summary-row sub-detail">
              <span>{shippingInfo.zoneName} - {shippingInfo.methodName}</span>
              <span>{shippingInfo.days}</span>
            </div>
          )}
        </div>

        {/* Subscription Costs */}
        <div className="summary-section">
          <div className="summary-row highlight">
            <span>Subscription (1st {billingCycle === 'monthly' ? 'month' : 'year'})</span>
          </div>
          <div className="summary-row sub">
            <span>{planDetails.name} Base</span>
            <span>${parseFloat(baseSubscription).toFixed(2)}</span>
          </div>
          {extraItemsCount > 0 && (
            <div className="summary-row sub extra">
              <span>{extraItemsCount}x Extra Items Fee</span>
              <span>${totalExtraFee.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total recurring-summary-row">
            <span>Recurring Total:</span>
            <strong>${recurringTotal.toFixed(2)}/{billingCycle === 'monthly' ? 'mo' : 'yr'}</strong>
          </div>
        </div>

        {/* Final Total Today */}
        <div className="summary-section final-total-section">
          <div className="summary-row total">
            <span>Total to pay today:</span>
            <strong>${initialTotal.toFixed(2)}</strong>
          </div>
        </div>

        {showButton && (
          <button 
            className={`btn btn-orange w-full ${processing ? 'loading' : ''}`} 
            style={{ marginTop: '24px' }}
            onClick={onProceed}
            disabled={!onProceed || !shippingInfo || processing}
          >
            {processing ? (
              <span className="btn-loading-content">
                <span className="spinner"></span>
                Setting up payment...
              </span>
            ) : buttonLabel}
          </button>
        )}

        <p className="summary-disclaimer">
          {currentStep === 3 
            ? 'Your payment is processed securely by Stripe. We never store your card details.'
            : 'Secure encrypted payment via Stripe. Cancel or change plans anytime in your dashboard.'
          }
        </p>
      </div>
    </div>
  );
}
