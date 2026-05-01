import LegalLayout from '@/components/LegalLayout';
import Link from 'next/link';

export const metadata = {
  title: 'Refund Policy — Back2Me Global',
  description: 'Back2Me Global refund and return policy for physical products and subscription plans.',
};

const s = {
  page: { background: '#fff', padding: '60px 0 80px' },
  prose: { maxWidth: '760px' },
  h2: { fontSize: '1.35rem', fontWeight: '800', color: 'var(--navy)', margin: '40px 0 10px', letterSpacing: '-0.3px' },
  h3: { fontSize: '1.05rem', fontWeight: '700', color: 'var(--navy)', margin: '24px 0 8px' },
  p: { fontSize: '0.96rem', lineHeight: '1.8', color: '#374151', marginBottom: '14px' },
  ul: { paddingLeft: '20px', marginBottom: '14px' },
  li: { fontSize: '0.96rem', lineHeight: '1.8', color: '#374151', marginBottom: '4px' },
  updated: { fontSize: '0.82rem', color: 'var(--gray-text)', marginBottom: '36px', display: 'block' },
  divider: { border: 'none', borderTop: '1px solid var(--border-gray)', margin: '40px 0' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' },
  th: { background: 'var(--off-white)', padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: 'var(--navy)', border: '1px solid var(--border-gray)' },
  td: { padding: '10px 14px', border: '1px solid var(--border-gray)', color: '#374151', lineHeight: '1.6' },
  highlight: { background: 'rgba(255,90,34,0.07)', border: '1px solid rgba(255,90,34,0.2)', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' },
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" subtitle="Last updated: April 28, 2026">
      <div style={s.page}>
        <div className="container" style={s.prose}>
          <span style={s.updated}>Effective date: April 28, 2026</span>

          <p style={s.p}>
            Back2Me Global operates two distinct business models: physical product sales (tags, stickers, wristbands) and a subscription-based recovery platform. This policy covers refunds for both.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>1. Physical Products — 30-Day Return Window</h2>

          <h3 style={s.h3}>1.1 Eligibility</h3>
          <p style={s.p}>
            You may return most unused, unopened physical Back2Me products within <strong>30 days of delivery</strong> for a full refund. To be eligible:
          </p>
          <ul style={s.ul}>
            <li style={s.li}>The item must be in its original condition — unused, with original packaging</li>
            <li style={s.li}>Tags that have been activated (linked to an account and used in a scan event) are not eligible for return unless defective</li>
          </ul>

          <h3 style={s.h3}>1.2 Defective or damaged items</h3>
          <p style={s.p}>
            If your item arrives damaged, defective, or incorrect, contact us within 30 days of delivery with photos of the issue (if applicable). We will either send a replacement at no cost or issue a full refund — your choice. You do not need to return defective items.
          </p>

          <h3 style={s.h3}>1.3 How to request a return</h3>
          <ol style={{ paddingLeft: '20px', marginBottom: '14px' }}>
            <li style={s.li}>Email <a href="mailto:support@back2meglobal.com" style={{ color: 'var(--orange)', fontWeight: '600' }}>support@back2meglobal.com</a> with your order number and reason for return</li>
            <li style={s.li}>We will reply within 1–2 business days with a Return Merchandise Authorization (RMA) number and return shipping label</li>
            <li style={s.li}>Ship the item back using the provided label</li>
            <li style={s.li}>Refund is issued within 5 business days of us receiving the return</li>
          </ol>

          <h3 style={s.h3}>1.4 Return shipping cost</h3>
          <ul style={s.ul}>
            <li style={s.li}><strong>Defective / wrong item:</strong> Back2Me covers return shipping</li>
            <li style={s.li}><strong>Changed mind / no longer needed:</strong> Customer is responsible for return shipping cost (deducted from refund or paid directly)</li>
          </ul>

          <hr style={s.divider} />

          <h2 style={s.h2}>2. Subscription Plans</h2>

          <h3 style={s.h3}>2.1 Monthly subscriptions</h3>
          <p style={s.p}>
            Monthly plans may be cancelled at any time. Your plan remains active until the end of the current billing period. <strong>Monthly payments are non-refundable</strong> — we do not issue partial-month refunds.
          </p>

          <h3 style={s.h3}>2.2 Annual subscriptions</h3>
          <p style={s.p}>
            Annual plans may be cancelled at any time. If you cancel within the first <strong>30 days</strong> of your annual subscription, you are eligible for a prorated refund for the unused months. After 30 days, no refund is issued — the subscription remains active until the annual period ends.
          </p>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Scenario</th>
                <th style={s.th}>Refund</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={s.td}>Cancel monthly plan before next renewal</td>
                <td style={s.td}>No refund — active until end of period</td>
              </tr>
              <tr>
                <td style={s.td}>Cancel annual plan within 30 days</td>
                <td style={s.td}>Prorated refund for unused months</td>
              </tr>
              <tr>
                <td style={s.td}>Cancel annual plan after 30 days</td>
                <td style={s.td}>No refund — active until end of annual period</td>
              </tr>
              <tr>
                <td style={s.td}>Duplicate charge (billing error)</td>
                <td style={s.td}>Full refund of the duplicate</td>
              </tr>
            </tbody>
          </table>

          <h3 style={s.h3}>2.3 How to cancel</h3>
          <p style={s.p}>
            Cancel directly in your Back2Me dashboard under <strong>Account → Subscription → Cancel Plan</strong>. For billing errors or disputes, email <a href="mailto:support@back2meglobal.com" style={{ color: 'var(--orange)', fontWeight: '600' }}>support@back2meglobal.com</a>.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>3. Mail-It-Back Labels</h2>

          <div style={s.highlight}>
            <p style={{ ...s.p, marginBottom: 0 }}>
              Mail-It-Back is a user-to-user shipping facilitation service. Back2Me generates a prepaid label (prepaid by the Owner), but the item is shipped directly between the Finder and the Owner — Back2Me never handles the item.
            </p>
          </div>

          <ul style={s.ul}>
            <li style={s.li}>Pre-paid labels that have not been used (no carrier scan) may be voided within 24 hours of generation by contacting support</li>
            <li style={s.li}>Labels that have been used by the carrier are non-refundable</li>
            <li style={s.li}>Back2Me is not responsible for carrier delays, damage during transit, or loss of items shipped via Mail-It-Back — those claims must be directed to the carrier</li>
          </ul>

          <hr style={s.divider} />

          <h2 style={s.h2}>4. Non-Refundable Items</h2>
          <ul style={s.ul}>
            <li style={s.li}>Activated tags (used in at least one scan event)</li>
            <li style={s.li}>Monthly subscription payments after the billing period has started</li>
            <li style={s.li}>Annual subscription payments after the 30-day window</li>
            <li style={s.li}>Used Mail-It-Back shipping labels</li>
          </ul>

          <div style={{ background: 'var(--off-white)', border: '1px solid var(--border-gray)', borderRadius: '8px', padding: '16px 20px', marginTop: '8px' }}>
            <p style={{ ...s.p, marginBottom: 0, fontSize: '0.88rem', color: '#374151' }}>
              <strong>Please note:</strong> All refunds are subject to review and approval. We reserve the right to deny refund requests in cases of misuse, fraud, or violation of our Terms.
            </p>
          </div>

          <hr style={s.divider} />

          <h2 style={s.h2}>5. Refund Timeline</h2>
          <p style={s.p}>
            Once approved, refunds are issued to your original payment method via Stripe within <strong>5–10 business days</strong>. Bank processing time may add 2–3 additional business days depending on your bank.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>6. Contact</h2>
          <p style={s.p}>
            For returns or refund questions, email <a href="mailto:support@back2meglobal.com" style={{ color: 'var(--orange)', fontWeight: '600' }}>support@back2meglobal.com</a> or visit our <Link href="/contact" style={{ color: 'var(--orange)', fontWeight: '600' }}>Contact page</Link>.
          </p>

        </div>
      </div>
    </LegalLayout>
  );
}
