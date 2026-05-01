import LegalLayout from '@/components/LegalLayout';
import Link from 'next/link';

export const metadata = {
  title: 'About — Back2Me Global',
  description: 'Learn how Back2Me Global connects people with their lost belongings through smart QR technology.',
};

const s = {
  page: { background: 'var(--off-white)' },
  section: { padding: '60px 0' },
  sectionWhite: { padding: '60px 0', background: '#fff' },
  h2: { fontSize: '1.6rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '16px', letterSpacing: '-0.3px' },
  h3: { fontSize: '1.15rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '10px' },
  p: { fontSize: '1rem', lineHeight: '1.75', color: '#374151', marginBottom: '16px' },
  card: {
    background: '#fff',
    border: '1px solid var(--border-gray)',
    borderRadius: '12px',
    padding: '28px',
    flex: '1 1 280px',
  },
  grid: { display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '32px' },
  pill: {
    display: 'inline-block',
    background: 'rgba(255,90,34,0.1)',
    color: 'var(--orange)',
    fontWeight: '700',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '4px 12px',
    borderRadius: '99px',
    marginBottom: '14px',
  },
  divider: { borderTop: '1px solid var(--border-gray)', margin: '0' },
};

export default function AboutPage() {
  return (
    <LegalLayout title="About Back2Me" subtitle="The world's smartest lost &amp; found platform">
      <div style={s.page}>

        {/* Mission */}
        <section style={s.sectionWhite}>
          <div className="container" style={{ maxWidth: '780px' }}>
            <span style={s.pill}>Our Mission</span>
            <h2 style={s.h2}>Reuniting people with what matters most</h2>
            <p style={s.p}>
              Back2Me Global was built around a simple belief: losing something you love shouldn&apos;t mean losing it forever. Whether it&apos;s your dog, your child&apos;s backpack, or your passport at an airport, there should be an effortless, safe way for a kind stranger to get it back to you.
            </p>
            <p style={s.p}>
              We built that bridge. A QR code, a scan, an instant connection — no apps, no downloads, no friction for the finder.
            </p>
          </div>
        </section>

        <hr style={s.divider} />

        {/* How we operate */}
        <section style={s.section}>
          <div className="container" style={{ maxWidth: '780px' }}>
            <span style={s.pill}>How We Operate</span>
            <h2 style={s.h2}>Two sides of one platform</h2>
            <p style={s.p}>
              Back2Me operates as both a product business and a technology platform. Understanding how each side works helps you know exactly what to expect from us.
            </p>

            <div style={s.grid}>
              <div style={{ ...s.card, borderTop: '3px solid var(--orange)' }}>
                <h3 style={s.h3}>🏷️ Product Sales</h3>
                <p style={{ ...s.p, marginBottom: 0 }}>
                  We sell and ship physical Back2Me tags — silicone wristbands, luggage tags, pet tags, and stickers. When you order from us, we pack and ship directly to your door. Your order is fulfilled by Back2Me, and we are responsible for it end-to-end.
                </p>
              </div>
              <div style={{ ...s.card, borderTop: '3px solid var(--navy)' }}>
                <h3 style={s.h3}>🔁 Recovery Platform</h3>
                <p style={{ ...s.p, marginBottom: '10px' }}>
                  When a finder scans a Back2Me tag, our platform opens a secure, private chat between the finder and the owner. Users can also connect via phone call with both numbers securely masked, so neither party needs to share personal contact details.
                </p>
                <p style={{ ...s.p, marginBottom: '10px' }}>
                  If the item needs to travel, our Mail-It-Back feature generates a prepaid shipping label (prepaid by the Owner). Return shipping is simple and secure — the prepaid label can be printed or accessed via QR code at a carrier location.
                </p>
                <p style={{ ...s.p, marginBottom: 0 }}>
                  To protect your privacy, you can choose to use a drop-off location instead of your home address. The process requires no direct exchange of personal contact details between users.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr style={s.divider} />

        {/* Values */}
        <section style={s.sectionWhite}>
          <div className="container" style={{ maxWidth: '780px' }}>
            <span style={s.pill}>What We Stand For</span>
            <h2 style={s.h2}>Built on trust</h2>

            <div style={s.grid}>
              {[
                { icon: '🔒', title: 'Privacy by Default', body: 'The owner\'s phone number, address, and email are never displayed to finders. Finders can report a find without creating an account or sharing any personal data.' },
                { icon: '⚡', title: 'Zero Friction Recovery', body: 'The scan-to-reconnect experience works on any phone, in any language, with no app download required. We remove every possible barrier to doing the right thing.' },
                { icon: '🌍', title: 'Global Coverage', body: 'Our tags work everywhere. Whether your tag is scanned in São Paulo or Singapore, the recovery flow is instant and consistent.' },
                { icon: '🤝', title: 'Honest Business', body: 'We are transparent about what we are: a product company and a technology platform. We never overstate what we can guarantee in a user-to-user recovery scenario.' },
              ].map(v => (
                <div key={v.title} style={{ ...s.card, flex: '1 1 240px' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{v.icon}</div>
                  <h3 style={s.h3}>{v.title}</h3>
                  <p style={{ ...s.p, marginBottom: 0 }}>{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr style={s.divider} />

        {/* CTA */}
        <section style={{ ...s.section, textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <h2 style={s.h2}>Ready to protect what matters?</h2>
            <p style={s.p}>
              Get a Back2Me kit and activate your first tag in under two minutes.
            </p>
            <Link href="/#pricing" className="btn btn-orange" style={{ display: 'inline-block', padding: '14px 36px', fontSize: '1rem', fontWeight: '700', textDecoration: 'none', borderRadius: '8px' }}>
              See Plans &amp; Pricing
            </Link>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
}
