import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Privacy Policy — Back2Me Global',
  description: 'How Back2Me Global collects, uses, and protects your personal information.',
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
  highlight: { background: 'rgba(255,90,34,0.07)', border: '1px solid rgba(255,90,34,0.2)', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' },
  divider: { border: 'none', borderTop: '1px solid var(--border-gray)', margin: '40px 0' },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" subtitle="Last updated: April 28, 2026">
      <div style={s.page}>
        <div className="container" style={s.prose}>
          <span style={s.updated}>Effective date: April 28, 2026</span>

          <p style={s.p}>
            Back2Me Global (&quot;Back2Me,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates both a product business (selling physical QR tags) and a recovery platform (connecting item finders with item owners). This Privacy Policy explains how we collect, use, and protect information in both contexts.
          </p>

          <div style={s.highlight}>
            <strong style={{ color: 'var(--orange)' }}>Key principle:</strong>
            <p style={{ ...s.p, marginBottom: 0, marginTop: '6px' }}>
              Finders who scan a Back2Me tag are never required to create an account or share personal information with Back2Me or the item owner. The owner&apos;s personal details are never displayed to a finder.
            </p>
          </div>

          <hr style={s.divider} />

          <h2 style={s.h2}>1. Information We Collect</h2>

          <h3 style={s.h3}>From product customers (tag buyers)</h3>
          <ul style={s.ul}>
            <li style={s.li}><strong>Identity:</strong> name, email address</li>
            <li style={s.li}><strong>Payment:</strong> processed exclusively by Stripe — we do not store card numbers</li>
            <li style={s.li}><strong>Shipping address</strong> for physical order fulfillment</li>
            <li style={s.li}><strong>Subscription data:</strong> plan type, billing cycle, renewal dates</li>
          </ul>

          <h3 style={s.h3}>From registered tag owners (dashboard users)</h3>
          <ul style={s.ul}>
            <li style={s.li}>Profile information you choose to add (emergency contacts, medical notes, pet details)</li>
            <li style={s.li}>Tag registration and activation data</li>
            <li style={s.li}>Scan event history (when your tags were scanned, location if shared by the finder)</li>
            <li style={s.li}>Recovery chat messages (stored only for the duration of the recovery event, accessible only to the owner and the finder who initiated the scan)</li>
          </ul>

          <h3 style={s.h3}>From finders (people who scan a tag)</h3>
          <ul style={s.ul}>
            <li style={s.li}>The scan event itself (timestamp, tag ID, approximate geolocation if the browser grants permission)</li>
            <li style={s.li}>Any message the finder voluntarily sends through the recovery chat</li>
            <li style={s.li}>Shipping address if the finder initiates a Mail-It-Back return (used only to generate the label)</li>
          </ul>
          <p style={s.p}>
            Finders are never required to create an account. We do not profile finders or use finder data for marketing purposes.
          </p>

          <h3 style={s.h3}>Automatically collected data</h3>
          <ul style={s.ul}>
            <li style={s.li}>Browser type, device type, IP address, referring URL</li>
            <li style={s.li}>Pages visited, time on site, click events (via analytics)</li>
            <li style={s.li}>Cookies — see Section 7 below</li>
          </ul>

          <hr style={s.divider} />

          <h2 style={s.h2}>2. How We Use Your Information</h2>
          <ul style={s.ul}>
            <li style={s.li}><strong>Order fulfillment:</strong> process payment, pack, and ship physical products</li>
            <li style={s.li}><strong>Platform operation:</strong> route scan events, open recovery chats, generate Mail-It-Back labels</li>
            <li style={s.li}><strong>Account management:</strong> subscription billing, dashboard access, tag activation</li>
            <li style={s.li}><strong>Communications:</strong> order confirmations, scan alerts, recovery notifications, service updates</li>
            <li style={s.li}><strong>Security:</strong> detect fraud, suspicious activity, and policy violations</li>
            <li style={s.li}><strong>Analytics:</strong> understand how the platform is used (aggregated and anonymized)</li>
            <li style={s.li}><strong>Legal compliance:</strong> respond to lawful requests and fulfill our obligations</li>
          </ul>

          <hr style={s.divider} />

          <h2 style={s.h2}>3. Sharing of Information</h2>
          <p style={s.p}>We do not sell your personal data. We share information only as follows:</p>
          <ul style={s.ul}>
            <li style={s.li}><strong>Stripe</strong> — payment processing and subscription management</li>
            <li style={s.li}><strong>Twilio</strong> — SMS notifications to registered owners for scan events and alerts</li>
            <li style={s.li}><strong>EasyPost / shipping carriers</strong> — to generate and fulfill shipping labels for product orders and Mail-It-Back events</li>
            <li style={s.li}><strong>Supabase</strong> — database and authentication infrastructure</li>
            <li style={s.li}><strong>Legal authorities</strong> — if required by law, court order, or to protect safety</li>
          </ul>
          <p style={s.p}>
            During a recovery event, the item owner&apos;s profile message is displayed to the finder — but only the content the owner has explicitly chosen to share (e.g., a return message or emergency contact). The owner&apos;s name, email, and address are never shown.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>4. Security</h2>
          <p style={s.p}>
            We use industry-standard measures to protect your data: TLS encryption in transit, encryption at rest for sensitive fields, and role-based access controls. Recovery chat messages are transmitted over encrypted connections and protected by strict access controls — only the finder who initiated the scan and the item owner can access a given conversation. No system is completely secure; we cannot guarantee absolute security, but we take reasonable precautions.
          </p>
          <p style={s.p}>
            We may monitor or review communications between users strictly for safety, support, and fraud prevention purposes. Access to such communications is limited to authorized personnel and handled in accordance with our privacy and security practices.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>5. Cookies</h2>
          <p style={s.p}>
            We use cookies and similar tracking technologies for:
          </p>
          <ul style={s.ul}>
            <li style={s.li}><strong>Strictly necessary:</strong> authentication sessions, checkout cart state</li>
            <li style={s.li}><strong>Analytics:</strong> aggregate usage metrics to improve the platform</li>
            <li style={s.li}><strong>Marketing:</strong> only if you opt in (e.g., retargeting ads)</li>
          </ul>
          <p style={s.p}>
            You can control cookies through your browser settings. Disabling strictly necessary cookies may prevent the platform from functioning correctly.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>6. Children</h2>
          <p style={s.p}>
            Our services are intended for use by parents or legal guardians. We may collect and process limited information about children under 13 only with verifiable parental consent.
          </p>
          <p style={s.p}>This information may include:</p>
          <ul style={s.ul}>
            <li style={s.li}>The child&apos;s first name or nickname</li>
            <li style={s.li}>Medical information that the parents think is important to share, such as allergies</li>
          </ul>
          <p style={s.p}>
            We do not allow children to create accounts or directly interact with the platform.
          </p>
          <p style={s.p}>
            Parents or guardians may review, update, or delete their child&apos;s information at any time using their dashboard.
          </p>
          <p style={s.p}>
            If we become aware that we have collected personal data from a child without parental consent, we will delete it promptly.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>7. Changes to This Policy</h2>
          <p style={s.p}>
            We may update this Privacy Policy from time to time. When we do, we will post the new version here and update the &quot;Last updated&quot; date. For material changes, we will notify registered users by email.
          </p>

          <hr style={s.divider} />

          <h2 style={s.h2}>8. Contact</h2>
          <p style={s.p}>
            Questions or concerns about this policy? Email <a href="mailto:support@back2meglobal.com" style={{ color: 'var(--orange)', fontWeight: '600' }}>support@back2meglobal.com</a>.
          </p>

        </div>
      </div>
    </LegalLayout>
  );
}
