export const SHIPPING_MARKUP = {
  fixedFee: 1.00,        // Flat $1 fee per label
  percentage: 0.15,      // 15% margin
  roundToNearest: '99',  // End all prices in .99 for psychological pricing
};

// ── Carrier QR Code Support ─────────────────────────────────────
// Which carriers support printer-free QR drop-off?
export const CARRIER_QR_SUPPORT = {
  UPS:   { supportsQR: true,  dropoffName: 'UPS Store / Access Point' },
  FedEx: { supportsQR: true,  dropoffName: 'FedEx Office' },
  USPS:  { supportsQR: false, dropoffName: 'Post Office' },
  DHL:   { supportsQR: false, dropoffName: 'DHL ServicePoint' },
};

// Preferred carrier order for rate bucketing (QR-capable first)
export const CARRIER_PRIORITY = ['UPS', 'FedEx', 'USPS', 'DHL'];

/**
 * Generate a QR code image URL for a tracking number (zero dependencies).
 */
export function getQRCodeURL(trackingCode, size = 300) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(trackingCode)}&margin=8`;
}

/**
 * Get the carrier tracking page URL for a given tracking code.
 */
export function getTrackingURL(carrier, trackingCode) {
  const urls = {
    UPS: `https://www.ups.com/track?tracknum=${trackingCode}`,
    FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingCode}`,
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingCode}`,
  };
  return urls[carrier] || `https://parcelsapp.com/en/tracking/${trackingCode}`;
}

// ── Parcel Size Presets ──────────────────────────────────────────
// The Finder selects the one that best matches the found item.
// Dimensions in inches, weight in ounces.
export const PARCEL_PRESETS = {
  envelope: {
    label: 'Envelope / Flat',
    description: 'Keys, cards, small documents',
    icon: '✉️',
    length: 10, width: 7, height: 0.5, weight: 4
  },
  small: {
    label: 'Small Package',
    description: 'Phone, wallet, jewelry, AirPods',
    icon: '📦',
    length: 8, width: 6, height: 3, weight: 16
  },
  medium: {
    label: 'Medium Package',
    description: 'Laptop, tablet, handbag, camera',
    icon: '📫',
    length: 14, width: 10, height: 5, weight: 48
  },
  large: {
    label: 'Large Package',
    description: 'Backpack, luggage, sports gear',
    icon: '🧳',
    length: 20, width: 14, height: 10, weight: 80
  }
};

/**
 * Calculates the marked-up price for any carrier base rate.
 * @param {string|number} baseRateString - E.g. "4.50"
 * @returns {object} { baseCost, markup, finalPrice } floats (e.g. 5.99)
 */
export function calculateMargin(baseRateString) {
  const baseCost = parseFloat(baseRateString);
  
  if (isNaN(baseCost)) {
    throw new Error('Invalid base rate supplied to margin calculator.');
  }

  // 1. Calculate raw markup: Base * 15% + $1.00
  let markup = (baseCost * SHIPPING_MARKUP.percentage) + SHIPPING_MARKUP.fixedFee;
  
  // 2. Add markup to base
  let rawFinal = baseCost + markup;

  // 3. Apply psychological rounding logic
  let finalPrice = rawFinal;
  if (SHIPPING_MARKUP.roundToNearest === '99') {
    // If raw is 6.12 -> floor is 6.00 -> returns 6.99
    // Wait, if 6.01, rounding to 6.99 is a bit high. 
    // Standard UX: Math.floor(rawFinal) + 0.99
    // If rawFinal is 6.99 it becomes 6.99.
    // Let's ensure we don't accidentally drastically undercharge if raw is 6.98 though.
    let wholeNumber = Math.floor(rawFinal);
    
    // If the decimal part is already .99, keep it. Otherwise, force to .99
    // We should safely push it to the *next* .99 to ensure we don't eat margin
    let decimalPart = rawFinal - wholeNumber;
    if (decimalPart <= 0.99 && decimalPart > 0) {
      finalPrice = wholeNumber + 0.99;
    }
  }

  // Recalculate definitive markup so tracking metrics are 100% exact to the penny
  markup = finalPrice - baseCost;

  return {
    baseCost: parseFloat(baseCost.toFixed(2)),
    markup: parseFloat(markup.toFixed(2)),
    finalPrice: parseFloat(finalPrice.toFixed(2)),
  };
}
