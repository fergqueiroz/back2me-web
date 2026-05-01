import EasyPostClient from '@easypost/api';

const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY);

// ─── Region Sets ──────────────────────────────────────────────────────────────

export const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
  'GB', // UK treated as EU-adjacent for carrier purposes
]);

export const ASIA_COUNTRIES = new Set([
  'JP', 'CN', 'KR', 'TW', 'HK', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'IN',
]);

// ─── Carrier Preferences by Route ─────────────────────────────────────────────

export const CARRIER_PREFERENCES = {
  domestic_us:   ['USPS', 'UPS'],
  eu_to_eu:      ['DHLExpress', 'DHL', 'Hermes', 'DPD', 'RoyalMail', 'LaPoste'],
  asia_to_asia:  ['Yamato', 'SFExpress', 'JapanPost', 'KoreaPost'],
  international: ['DHLExpress', 'DHL', 'UPS', 'FedEx'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns an ordered list of preferred carrier names for a given origin/destination pair.
 * @param {string} originCountry      ISO 3166-1 alpha-2 (e.g. "US", "DE")
 * @param {string} destinationCountry ISO 3166-1 alpha-2
 * @returns {string[]} ordered carrier name array
 */
export function getPreferredCarriers(originCountry, destinationCountry) {
  const o = (originCountry || '').toUpperCase();
  const d = (destinationCountry || '').toUpperCase();

  if (o === 'US' && d === 'US') return CARRIER_PREFERENCES.domestic_us;
  if (EU_COUNTRIES.has(o) && EU_COUNTRIES.has(d)) return CARRIER_PREFERENCES.eu_to_eu;
  if (ASIA_COUNTRIES.has(o) && ASIA_COUNTRIES.has(d)) return CARRIER_PREFERENCES.asia_to_asia;
  return CARRIER_PREFERENCES.international;
}

/**
 * Selects the cheapest rate from the preferred carrier list.
 * Falls back to the cheapest rate among all available rates if none match.
 * @param {object[]} rates            EasyPost rate objects
 * @param {string[]} preferredCarriers ordered carrier name array
 * @returns {object|null} best EasyPost rate object, or null if rates is empty
 */
export function selectBestRate(rates, preferredCarriers) {
  if (!rates || rates.length === 0) return null;

  const byPrice = (a, b) => parseFloat(a.rate) - parseFloat(b.rate);

  // Try each preferred carrier in priority order
  for (const carrier of preferredCarriers) {
    const matches = rates
      .filter(r => r.carrier.toLowerCase() === carrier.toLowerCase())
      .sort(byPrice);
    if (matches.length > 0) return matches[0];
  }

  // Fallback: cheapest of anything available
  return [...rates].sort(byPrice)[0];
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Creates an EasyPost shipment, picks the best rate using smart carrier
 * selection, purchases the label, and returns all relevant details.
 *
 * @param {object} params
 * @param {object} params.toAddress   EasyPost address object (recipient)
 * @param {object} params.fromAddress EasyPost address object (sender)
 * @param {object} params.parcel      EasyPost parcel object (length/width/height/weight)
 * @returns {Promise<{
 *   shipmentId: string,
 *   trackingCode: string,
 *   labelUrl: string,
 *   carrier: string,
 *   service: string,
 *   rate: string,
 *   currency: string,
 *   deliveryDays: number|null,
 * }>}
 */
export async function createSmartLabel({ toAddress, fromAddress, parcel }) {
  // 1. Create EasyPost shipment (fetches all carrier rates)
  const shipment = await easypost.Shipment.create({
    to_address: toAddress,
    from_address: fromAddress,
    parcel,
  });

  const originCountry = (fromAddress.country || 'US').toUpperCase();
  const destinationCountry = (toAddress.country || 'US').toUpperCase();
  const preferredCarriers = getPreferredCarriers(originCountry, destinationCountry);

  // 2. Pick the best rate
  const bestRate = selectBestRate(shipment.rates, preferredCarriers);
  if (!bestRate) {
    throw new Error('No shipping rates returned by EasyPost for this route.');
  }

  console.log(
    `[SmartLabel] Route: ${originCountry}→${destinationCountry} | ` +
    `Preferred: [${preferredCarriers.join(', ')}] | ` +
    `Selected: ${bestRate.carrier} ${bestRate.service} @ $${bestRate.rate} ${bestRate.currency}`
  );

  // 3. Buy the label
  const purchased = await easypost.Shipment.buy(shipment.id, bestRate);

  return {
    shipmentId:   purchased.id,
    trackingCode: purchased.tracking_code,
    labelUrl:     purchased.postage_label?.label_url || null,
    carrier:      bestRate.carrier,
    service:      bestRate.service,
    rate:         bestRate.rate,
    currency:     bestRate.currency,
    deliveryDays: bestRate.delivery_days ?? null,
  };
}
