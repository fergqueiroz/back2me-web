'use client';

import { useState } from 'react';
import Link from 'next/link';
import InquiryModal from '@/components/InquiryModal';

export default function PricingGrid() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showInquiry, setShowInquiry] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Kit',
      tagline: 'Personal protection',
      items: '3 active items',
      monthlyPrice: '4.90',
      yearlyPrice: '49.00',
      buttonTxt: 'Protect 3 Items',
      featured: false,
    },
    {
      id: 'plus',
      name: 'Combo Plus',
      tagline: 'Family & Gear Shield',
      items: '6 active items',
      monthlyPrice: '6.90',
      yearlyPrice: '69.00',
      buttonTxt: 'Protect 6 Items',
      featured: true,
      badge: 'Most Popular'
    },
    {
      id: 'elite',
      name: 'Elite 12',
      tagline: 'Full Ecosystem',
      items: '12 active items',
      monthlyPrice: '9.90',
      yearlyPrice: '99.00',
      buttonTxt: 'Protect 12 Items',
      featured: false,
    }
  ];

  const commonFeatures = [
    'Secure Anonymous Chat',
    'Direct Anonymous Calls',
    'Emergency Medical Profile',
    'Instant GPS Scan Alerts',
    'Secure Mail-Back Mediation',
    'No Apps / No Batteries Needed',
    'Global Coverage'
  ];

  return (
    <div className="pricing-wrapper">
      {/* Billing Toggle */}
      <div className="pricing-toggle-container">
        <span className={`toggle-label ${billingCycle === 'monthly' ? 'active' : ''}`}>Monthly</span>
        <button 
          className={`pricing-toggle-switch ${billingCycle === 'yearly' ? 'yearly' : ''}`}
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          aria-label="Toggle billing cycle"
        >
          <div className="toggle-knob"></div>
        </button>
        <div className="toggle-yearly-box">
          <span className={`toggle-label ${billingCycle === 'yearly' ? 'active' : ''}`}>Yearly</span>
          <span className="save-badge">2 Months Free</span>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="pricing-grid">
        {plans.map((plan) => (
          <div key={plan.name} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
            {plan.featured && <div className="pricing-badge">{plan.badge}</div>}
            <h3>{plan.name}</h3>
            <p className="pricing-sub">{plan.tagline}</p>
            
            <div className="pricing-items-count">
              {plan.items}
            </div>

            <div className="pricing-price">
              ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
              <span>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>

            <ul className="pricing-features">
              {commonFeatures.map((feature, i) => (
                <li key={i}>
                  <span className="feature-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link 
              href={`/checkout?plan=${plan.id}&billing=${billingCycle}`}
              className={`btn ${plan.featured ? 'btn-orange' : 'btn-outline'}`}
            >
              {plan.buttonTxt}
            </Link>
          </div>
        ))}
      </div>

      <div className="pricing-footer-note">
        <p>Need more? Add individual items for only <strong>$1.00/mo</strong> per item.</p>
      </div>

      {/* B2B / Hospitality Section */}
      <div className="b2b-cta-card">
        <div className="b2b-content">
          <div className="b2b-icon">🛳️</div>
          <div>
            <h3>Hospitality, Cruises & Events Partnership</h3>
            <p>
              Elevate your guest experience. Offer Back2Me wristbands, luggage tags, and premium stickers as a luxury safety amenity for 
              <strong> Resorts, Hotels, Cruise Lines, and Festivals</strong>. Provide total peace of mind for their valuables and loved ones.
            </p>
          </div>
        </div>
        <button className="btn btn-navy" onClick={() => setShowInquiry(true)}>
          Inquire for Luxury Brands
        </button>
        {showInquiry && <InquiryModal onClose={() => setShowInquiry(false)} />}
      </div>
    </div>
  );
}
