import Link from 'next/link';

export default function LegalLayout({ children, title, subtitle }) {
  return (
    <>
      <nav className="navbar" id="navbar">
        <div className="container navbar-inner">
          <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="/symbol-logo.jpg"
              alt="Back2Me Logo"
              style={{ height: '40px', width: 'auto', mixBlendMode: 'multiply' }}
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--orange)', fontWeight: '800' }}>Back2Me</span>
              <span style={{ color: 'var(--navy)', fontWeight: '800', marginLeft: '6px' }}>GLOBAL</span>
            </div>
          </Link>
          <ul className="nav-links">
            <li><a href="/#how-it-works">How It Works</a></li>
            <li><a href="/#who-we-protect">Who We Protect</a></li>
            <li><a href="/#pricing">Plans</a></li>
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/login" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy)', textDecoration: 'none' }}>
              Login
            </Link>
            <Link href="/#pricing" className="btn btn-orange nav-cta">
              Get Protected
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
        {(title || subtitle) && (
          <div style={{ background: 'var(--navy)', padding: '60px 0 48px' }}>
            <div className="container">
              {title && (
                <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', margin: 0 }}>{subtitle}</p>
              )}
            </div>
          </div>
        )}
        {children}
      </main>

      <footer className="footer">
        <div className="container">
          <p>Back2Me Global © 2026. All rights reserved.</p>
          <ul className="footer-links" style={{ flexWrap: 'wrap', rowGap: '10px' }}>
            <li><Link href="/about" style={{ color: 'var(--gray-text)', fontSize: '0.82rem', textDecoration: 'none' }}>About</Link></li>
            <li><Link href="/contact" style={{ color: 'var(--gray-text)', fontSize: '0.82rem', textDecoration: 'none' }}>Contact</Link></li>
            <li><Link href="/terms" style={{ color: 'var(--gray-text)', fontSize: '0.82rem', textDecoration: 'none' }}>Terms of Service</Link></li>
            <li><Link href="/privacy" style={{ color: 'var(--gray-text)', fontSize: '0.82rem', textDecoration: 'none' }}>Privacy Policy</Link></li>
            <li><Link href="/refund-policy" style={{ color: 'var(--gray-text)', fontSize: '0.82rem', textDecoration: 'none' }}>Refund Policy</Link></li>
            <li><Link href="/shipping-policy" style={{ color: 'var(--gray-text)', fontSize: '0.82rem', textDecoration: 'none' }}>Shipping Policy</Link></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
