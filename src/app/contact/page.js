import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Contact — Back2Me Global',
  description: 'Get in touch with the Back2Me team.',
};

const s = {
  page: { background: 'var(--off-white)', padding: '60px 0 80px' },
  h2: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px', letterSpacing: '-0.3px' },
  h3: { fontSize: '1.05rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '8px' },
  p: { fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', marginBottom: '12px' },
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
};

export default function ContactPage() {
  return (
    <LegalLayout title="Contact Us" subtitle="We're here to help">
      <div style={s.page}>
        <div className="container" style={{ maxWidth: '640px' }}>

          <span style={s.pill}>Get in Touch</span>
          <h2 style={s.h2}>Have a question?</h2>
          <p style={s.p}>
            For any questions about your order, account, recovery events, or anything else — reach out and we&apos;ll get back to you as soon as possible.
          </p>

          <div style={{ background: '#fff', border: '1px solid var(--border-gray)', borderRadius: '12px', padding: '36px', marginTop: '32px', borderTop: '3px solid var(--orange)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>✉️</div>
            <h3 style={s.h3}>Email</h3>
            <a
              href="mailto:support@back2meglobal.com"
              style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--orange)', textDecoration: 'none' }}
            >
              support@back2meglobal.com
            </a>
            <p style={{ ...s.p, marginTop: '12px', marginBottom: 0, color: 'var(--gray-text)' }}>
              We typically respond within 1–2 business days.
            </p>
          </div>

        </div>
      </div>
    </LegalLayout>
  );
}
