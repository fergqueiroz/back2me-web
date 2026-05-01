import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Terms of Service — Back2Me Global',
  description: 'Terms and conditions for using Back2Me Global products and platform.',
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
  callout: { background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' },
  divider: { border: 'none', borderTop: '1px solid var(--border-gray)', margin: '40px 0' },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" subtitle="Last updated: April 28, 2026">
      <div style={s.page}>
        <div className="container" style={s.prose}>
          <span style={s.updated}>Effective date: April 28, 2026</span>

          <p style={s.p}>
            These Terms of Service (&quot;Terms&quot;) govern your use of the Back2Me Global website, mobile experience, physical products, and recovery platform (collectively, the &quot;Service&quot;). By using the Service, you agree to these Terms.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>1. Definitions</h2>
          <ul style={s.ul}>
            <li style={s.li}><strong>Back2Me / we / us:</strong> Back2Me Global, the company that operates this Service.</li>
            <li style={s.li}><strong>Owner:</strong> A registered user who has purchased a Back2Me tag, activated it, and linked it to their account.</li>
            <li style={s.li}><strong>Finder:</strong> Any person who scans a Back2Me tag. Finders are not required to create an account.</li>
            <li style={s.li}><strong>Product Purchase:</strong> The sale of a physical Back2Me item (tag, sticker, wristband, etc.) shipped by Back2Me.</li>
            <li style={s.li}><strong>Platform / Recovery Service:</strong> The software infrastructure that routes scan events, opens secure private chats, and facilitates Mail-It-Back shipping between Finders and Owners.</li>
            <li style={s.li}><strong>Subscription:</strong> A recurring billing plan that enables platform features (dashboard, scan notifications, Mail-It-Back, chat).</li>
          </ul>

          <div style={s.callout}>
            <strong>Important distinction:</strong> Back2Me is both a product seller and a platform. When you purchase physical tags, Back2Me is the merchant of record and is fully responsible for fulfillment. When a Finder and an Owner communicate or exchange an item via the platform, Back2Me facilitates the connection but is not a party to that transaction and never takes possession of any item.
          </div>

          <hr style={s.divider} />

          <h2 style={s.h2}>2. Product Purchases</h2>
          <h3 style={s.h3}>2.1 What you're buying</h3>
          <p style={s.p}>
            Physical Back2Me products are sold and shipped by Back2Me Global. Prices are listed in USD and are subject to change. We reserve the right to cancel or refuse an order at our discretion.
          </p>
          <h3 style={s.h3}>2.2 Payment</h3>
          <p style={s.p}>
            All payments are processed by Stripe. We do not store your full card number. Your subscription is charged automatically on each renewal date.
          </p>
          <h3 style={s.h3}>2.3 Returns and refunds</h3>
          <p style={s.p}>
            See our <a href="/refund-policy" style={{ color: 'var(--orange)', fontWeight: '600' }}>Refund Policy</a> for full details.
          </p>
          <h3 style={s.h3}>2.4 Shipping</h3>
          <p style={s.p}>
            See our <a href="/shipping-policy" style={{ color: 'var(--orange)', fontWeight: '600' }}>Shipping Policy</a> for estimated delivery times, carriers, and international shipping terms.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>3. Platform and Subscription</h2>
          <h3 style={s.h3}>3.1 Account</h3>
          <p style={s.p}>
            To access dashboard features, you must create an account with a valid email address. You are responsible for maintaining the security of your account credentials.
          </p>
          <h3 style={s.h3}>3.2 Subscription plans</h3>
          <p style={s.p}>
            Platform features are unlocked by an active subscription. Plans renew automatically on a monthly or annual basis. You may cancel at any time; cancellation takes effect at the end of the current billing period.
          </p>
          <h3 style={s.h3}>3.3 Tag activation</h3>
          <p style={s.p}>
            Each physical tag must be activated and linked to your account. An unactivated tag will not display an owner profile when scanned.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>4. Recovery Events and Finder Conduct</h2>
          <h3 style={s.h3}>4.1 What Back2Me provides</h3>
          <p style={s.p}>
            When a tag is scanned, Back2Me notifies the registered Owner, opens a secure private chat channel, and (if requested) generates a pre-paid Mail-It-Back shipping label. Back2Me facilitates these connections but does not physically handle, transport, or take custody of any item.
          </p>
          <h3 style={s.h3}>4.2 Finder responsibilities</h3>
          <p style={s.p}>
            Finders agree to use the platform in good faith — to reunite items with their owners, not to exploit or defraud them. Misuse of the platform (e.g., demanding payment, theft, harassment) may be reported to law enforcement.
          </p>
          <h3 style={s.h3}>4.3 No guarantee of recovery</h3>
          <p style={s.p}>
            Back2Me cannot guarantee that a found item will be returned. Recovery depends on the Finder choosing to engage through the platform. Back2Me is not liable for items that are not returned.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>5. Prohibited Uses</h2>
          <p style={s.p}>You agree not to:</p>
          <ul style={s.ul}>
            <li style={s.li}>Use the platform to harass, threaten, or defraud anyone</li>
            <li style={s.li}>Attempt to reverse-engineer, copy, or exploit the platform</li>
            <li style={s.li}>Upload false or misleading profile information</li>
            <li style={s.li}>Use Back2Me tags to track a person without their consent</li>
            <li style={s.li}>Resell Back2Me tags without authorization</li>
          </ul>
          <p style={s.p}>Violation of these rules may result in immediate account termination without refund.</p>

          <hr style={s.divider} />

          <h2 style={s.h2}>6. Intellectual Property</h2>
          <p style={s.p}>
            All content on this website — including the Back2Me logo, platform design, and product images — is owned by or licensed to Back2Me Global. You may not reproduce or distribute it without written permission.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>7. Disclaimer of Warranties</h2>
          <p style={s.p}>
            The Service is provided &quot;as is&quot; without warranty of any kind. We do not warrant that the Service will be uninterrupted, error-free, or that scan events will always reach the Owner in real time. Physical products are warranted against defects as described in our Refund Policy.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>8. Limitation of Liability</h2>
          <p style={s.p}>
            To the maximum extent permitted by law, Back2Me Global shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to lost items, failed recovery events, or data loss. Our maximum aggregate liability for any claim is limited to the amount you paid us in the 12 months preceding the claim.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>9. Governing Law</h2>
          <p style={s.p}>
            These Terms are governed by the laws of the State of Virginia, United States, without regard to its conflict-of-law provisions. Any dispute shall be resolved by binding arbitration, except that either party may seek injunctive relief in a court of competent jurisdiction.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>10. Changes to These Terms</h2>
          <p style={s.p}>
            We may update these Terms at any time. Continued use of the Service after the effective date of changes constitutes acceptance. We will notify registered users of material changes by email at least 14 days in advance.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>11. Contact</h2>
          <p style={s.p}>
            Questions about these Terms? Email <a href="mailto:support@back2meglobal.com" style={{ color: 'var(--orange)', fontWeight: '600' }}>support@back2meglobal.com</a>.
          </p>

        </div>
      </div>
    </LegalLayout>
  );
}
