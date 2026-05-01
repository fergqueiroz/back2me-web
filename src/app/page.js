import ProductsShowcase from './components/ProductsShowcase';
import PricingGrid from './components/PricingGrid';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          NAVBAR — Glassmorphic, fixed, minimal
          ═══════════════════════════════════════════════════════════ */}
      <nav className="navbar" id="navbar">
        <div className="container navbar-inner">
          <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/symbol-logo.jpg" 
              alt="Back2Me Logo Symbol" 
              style={{ height: '40px', width: 'auto', mixBlendMode: 'multiply' }} 
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--orange)', fontWeight: '800' }}>Back2Me</span>
              <span style={{ color: 'var(--navy)', fontWeight: '800', marginLeft: '6px' }}>GLOBAL</span>
            </div>
          </div>
          <ul className="nav-links">
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#who-we-protect">Who We Protect</a></li>
            <li><a href="#pricing">Plans</a></li>
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/login" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy)', textDecoration: 'none' }}>
              Login
            </Link>
            <button className="btn btn-orange nav-cta" id="nav-cta">
              Get Protected
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          PHASE 1 — THE ORDINARY WORLD (Hero Section)
          Clean white, bold typography, emotional hook
          ═══════════════════════════════════════════════════════════ */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <h2 className="fade-loop-text" style={{ fontSize: '1.4rem', letterSpacing: '0', fontWeight: '700', marginBottom: '16px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--navy)' }}>The longest second of your life is when you look to the side and... </span>
            <span style={{ color: 'var(--navy)' }}>they're gone.</span>
          </h2>

          <h1 className="hero-headline" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '0.05em', color: 'var(--orange)', marginTop: '0', marginBottom: '32px' }}>
            The World&apos;s Smartest<br />
            <span className="accent" style={{ color: 'var(--orange)' }}>Lost &amp; Found Platform</span>
          </h1>

          <p className="hero-sub" style={{ marginBottom: '48px' }}>
            Reconnect with who and what you love—instantly, safely, and without a single app download.
          </p>

          {/* Embedded Video Block */}
          <div className="hero-video-wrapper">
            <div className="hero-video-container">
              <video 
                src="/video.mp4" 
                controls 
                autoPlay 
                muted 
                loop 
                playsInline
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, objectFit: 'cover' }}
              />
            </div>
          </div>

          <div className="trust-badges">
            <div className="trust-badge">
              <span className="trust-badge-icon">🔋</span>
              No batteries
            </div>
            <div className="trust-badge">
              <span className="trust-badge-icon">🔒</span>
              100% Privacy
            </div>
            <div className="trust-badge">
              <span className="trust-badge-icon">📱</span>
              Zero apps for finders
            </div>
            <div className="trust-badge">
              <span className="trust-badge-icon">✓</span>
              Global Reach
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: '48px' }}>
            <button className="btn btn-navy" id="hero-cta-primary">
              Secure Your World Today
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHASE 2 — THE MONSTER IN THE DARK (Pain Point)
          Agitate the fear, then bridge to hope
          ═══════════════════════════════════════════════════════════ */}
      <section className="section-alt" id="the-problem">
        <div className="container text-center">
          <span className="pre-label">The Hard Truth</span>
          <h2 className="headline">
            The &ldquo;GPS Trap&rdquo;: Why traditional<br />trackers aren&apos;t enough.
          </h2>
          <p className="subheadline">
            We&apos;ve all been there. That split-second of silence. The sudden realization
            that your child isn&apos;t in sight, your dog has bolted, or your
            life&apos;s work is gone.
          </p>

          <ul className="pain-list">
            <li>
              <span className="x-icon">✕</span>
              The battery is dead.
            </li>
            <li>
              <span className="x-icon">✕</span>
              The range is limited.
            </li>
            <li>
              <span className="x-icon">✕</span>
              The tracker was discarded by someone who didn&apos;t want to be followed.
            </li>
          </ul>

          <div className="bridge">
            <p>
              When technology hits a wall, you don&apos;t need a signal.
              <strong> You need a soul.</strong> Is the safety of your toddler,
              the life of your pet, or your $3,000 laptop worth the cost of a
              single cup of coffee per month? We believe some things are priceless.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHASE 2.5 — THE GLOBAL TRUST SHIELD
          Navy section with trust cards
          ═══════════════════════════════════════════════════════════ */}
      <section className="section-navy" id="trust-shield">
        <div className="container text-center">
          <span className="pre-label">Built for the Whole World</span>
          <h2 className="headline">
            A global recovery network,<br />engineered for trust.
          </h2>
          <p className="subheadline">
            Operating across 150+ countries. Backed by secure, private connections. Powered by human connection.
          </p>

          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-card-icon">🌐</div>
              <h3>24/7 Global Coverage</h3>
              <p>Your tags work anywhere in the world. Any phone, any browser, any time.</p>
            </div>
            <div className="trust-card">
              <div className="trust-card-icon">🔐</div>
              <h3>Secure Private Chat</h3>
              <p>Connect with finders anonymously. Phone numbers stay hidden on both sides.</p>
            </div>
            <div className="trust-card">
              <div className="trust-card-icon">📍</div>
              <h3>Instant Scan Alerts</h3>
              <p>The moment someone scans your tag, you get an alert with their location.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHASE 3 — MEETING THE MENTOR (The Solution)
          ═══════════════════════════════════════════════════════════ */}
      <section className="section" id="the-solution">
        <div className="container text-center">
          <span className="pre-label">The Solution</span>
          <h2 className="headline">
            Meet the bridge between<br />loss and relief.
          </h2>
          <p className="subheadline">
            Back2Me isn&apos;t just a tag. It&apos;s a global recovery network,
            powered by smart, laser-engraved technology. Our tags turn any stranger
            with a smartphone into your greatest ally.
          </p>

          <div style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: 'var(--off-white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-gray)',
            marginTop: '8px'
          }}>
            <p style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--navy)',
              letterSpacing: '-0.3px',
              margin: 0
            }}>
              &ldquo;No apps. No batteries. No friction.<br />Just a direct line back to you.&rdquo;
            </p>
          </div>

          <ProductsShowcase />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHASE 4 — THE CROSSING (How It Works)
          3-step cards
          ═══════════════════════════════════════════════════════════ */}
      <section className="section-alt" id="how-it-works">
        <div className="container text-center">
          <span className="pre-label">Simple by Design</span>
          <h2 className="headline">
            Three steps. That&apos;s all it takes.
          </h2>
          <p className="subheadline">
            We made doing the right thing effortless, anonymous, and instant for whoever finds your belongings.
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-illustration">
                <img src="/illustrations/step1.png" alt="Secure your world" />
              </div>
              <div className="step-number">1</div>
              <h3>Snap &amp; Secure</h3>
              <p>
                Attach your premium Back2Me silicone tag or vinyl sticker to your
                loved one or valuable. Activate your plan and upload medical needs,
                emergency contacts, or a heartfelt message.
              </p>
            </div>

            <div className="step-card">
              <div className="step-illustration">
                <img src="/illustrations/step2.png" alt="Instant Scan" />
              </div>
              <div className="step-number">2</div>
              <h3>The Instant Scan</h3>
              <p>
                A finder scans the high-visibility QR with their phone camera.
                No app required. They instantly see your secure profile, critical
                medical notes, and your plea for a safe return.
              </p>
            </div>

            <div className="step-card">
              <div className="step-illustration">
                <img src="/illustrations/step3.png" alt="Safe Return" />
              </div>
              <div className="step-number">3</div>
              <h3>Reclaim with Zero Friction</h3>
              <p>
                The finder chats or calls you via our secure portal. Or with our
                <strong>&ldquo;Mail it Back&rdquo;</strong> feature, a shipping label is generated
                instantly. The finder simply drops it at any local post office. Done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHASE 5 — THE ALLIANCE (Use Cases)
          4 cards with hover effects
          ═══════════════════════════════════════════════════════════ */}
      <section className="section" id="who-we-protect">
        <div className="container text-center">
          <span className="pre-label">Who Are We Protecting Today?</span>
          <h2 className="headline">
            Built for every journey.<br />Designed for every soul.
          </h2>
          <p className="subheadline">
            Whether you&apos;re a parent, a pet lover, a professional, or the life of
            the party — Back2Me has your back.
          </p>

          <div className="use-cases-grid">
            <div className="use-case-card">
              <div className="use-case-icon">👨‍👩‍👧</div>
              <h3>The Protector</h3>
              <p>
                Keep your toddlers and elderly loved ones &ldquo;One Snap Away&rdquo;
                in crowded beaches, theme parks, resorts, or festivals. Your emergency lifeline.
              </p>
            </div>

            <div className="use-case-card">
              <div className="use-case-icon">🐾</div>
              <h3>The Best Friend</h3>
              <p>
                Ensure the person who finds your dog or cat knows their medical
                history, allergies, and vet contact immediately.
              </p>
            </div>

            <div className="use-case-card">
              <div className="use-case-icon">💼</div>
              <h3>The Professional</h3>
              <p>
                Protect your $3,000 investments. From Macbooks to camera gear,
                ski equipment to musical instruments.
              </p>
            </div>

            <div className="use-case-card">
              <div className="use-case-icon">🎉</div>
              <h3>The Life of the Party</h3>
              <p>
                Wearable safety for festival-goers and nightlife lovers. A quick
                scan on your bracelet ensures someone can reach your friend to get you home safe.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt" id="pricing">
        <div className="container text-center">
          <span className="pre-label">Simple, Transparent Pricing</span>
          <h2 className="headline">
            One platform.<br />Unlimited Peace of Mind.
          </h2>
          <p className="subheadline">
            All plans include our full suite of premium security features.<br />
            Simply choose how many items you want to keep active.
          </p>

          <PricingGrid />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHASE 7 — THE RETURN (Final CTA)
          Navy background, emotional close
          ═══════════════════════════════════════════════════════════ */}
      <section className="final-cta" id="final-cta">
        <div className="container">
          <h2 className="final-headline">
            Sleep better. Travel further.<br />Love deeper.
          </h2>
          <p className="final-sub">
            Because you aren&apos;t just buying a tag. You&apos;re joining a global network
            dedicated to making sure that &ldquo;Lost&rdquo; is only a temporary state.
          </p>
          <button className="btn btn-orange" id="final-cta-btn" style={{ padding: '18px 48px', fontSize: '1.05rem' }}>
            Activate Your Protection Plan Now
          </button>
          <p className="final-tagline">
            <strong>Back2Me Global.</strong> Just one snap away.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="container">
          <p>Back2Me Global © 2026. All rights reserved.</p>
          <ul className="footer-links">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/refund-policy">Refunds</Link></li>
            <li><Link href="/shipping-policy">Shipping</Link></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
