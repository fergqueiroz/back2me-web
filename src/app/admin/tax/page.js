import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(cents, currency = 'usd') {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

function locationStr(address) {
  if (!address) return null;
  return [address.city, address.state, address.country].filter(Boolean).join(', ') || null;
}

function statusBadge(variant) {
  const palette = {
    active:   { backgroundColor: '#d1fae5', color: '#065f46' },
    pending:  { backgroundColor: '#fef3c7', color: '#92400e' },
    inactive: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  };
  return {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    ...(palette[variant] ?? palette.inactive),
  };
}

function autoTaxStyle(status) {
  const map = {
    complete:                 { bg: '#d1fae5', color: '#065f46' },
    requires_location_inputs: { bg: '#fef3c7', color: '#92400e' },
    failed:                   { bg: '#fee2e2', color: '#991b1b' },
  };
  return map[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getTaxData() {
  const fetchedAt = Date.now();

  const [settingsResult, invoicesResult] = await Promise.allSettled([
    stripe.tax.settings.retrieve(),
    stripe.invoices.list({
      limit: 20,
      status: 'paid',
      expand: ['data.customer'],
    }),
  ]);

  const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;
  const invoices = invoicesResult.status === 'fulfilled' ? invoicesResult.value.data : [];

  const totalTax     = invoices.reduce((sum, inv) => sum + (inv.tax         ?? 0), 0);
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount_paid ?? 0), 0);

  return {
    settings,
    invoices,
    totalTax,
    totalRevenue,
    fetchedAt,
    errors: {
      settings: settingsResult.status === 'rejected',
      invoices: invoicesResult.status === 'rejected',
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminTaxPage() {
  const { settings, invoices, totalTax, totalRevenue, fetchedAt, errors } = await getTaxData();

  const taxStatus    = settings?.status ?? null;
  const taxEnabled   = taxStatus === 'active';
  const taxPending   = taxStatus === 'pending';
  const lastUpdated  = settings?.updated ? fmtDateTime(settings.updated) : null;
  const missingFields = settings?.status_details?.pending?.missing_fields ?? [];
  const pageLoadedStr = new Date(fetchedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC', timeZoneName: 'short',
  });
  const taxedInvoiceCount = invoices.filter(inv => (inv.tax ?? 0) > 0).length;

  return (
    <div className="admin-page">

      {/* ── Header ── */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Tax</h1>
        <p className="admin-page-subtitle">
          Stripe Tax status · Automatic collection · Internal use only
        </p>
      </div>

      {/* ══════════════════════════════════════════════
          Section 1 — Tax Status
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Tax Status</h2>

        {errors.settings && (
          <ErrorBanner>
            Could not load Stripe Tax settings. Stripe Tax may not be enabled on this account —
            configure it at dashboard.stripe.com/tax.
          </ErrorBanner>
        )}

        <div style={s.cardGrid}>

          {/* Status */}
          <div style={{
            ...s.card,
            borderTop: `3px solid ${taxEnabled ? '#10b981' : taxPending ? '#f59e0b' : '#9ca3af'}`,
          }}>
            <div style={s.cardLabel}>Stripe Tax Status</div>
            <div style={{ marginTop: '12px' }}>
              {taxEnabled && <span style={statusBadge('active')}>Active</span>}
              {taxPending && <span style={statusBadge('pending')}>Pending Setup</span>}
              {!taxEnabled && !taxPending && (
                <span style={statusBadge('inactive')}>
                  {errors.settings ? 'Unknown' : 'Not Configured'}
                </span>
              )}
            </div>
            {missingFields.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
                Missing: {missingFields.join(', ')}
              </div>
            )}
          </div>

          {/* Last Sync */}
          <div style={{ ...s.card, borderTop: '3px solid #6366f1' }}>
            <div style={s.cardLabel}>Last Sync</div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              {lastUpdated ?? '—'}
            </div>
            <div style={{ ...s.cardSub, marginTop: '8px' }}>
              Page loaded: {pageLoadedStr}
            </div>
          </div>

          {/* Head Office (only shown when configured) */}
          {settings?.head_office?.address && (
            <div style={{ ...s.card, borderTop: '3px solid #0ea5e9' }}>
              <div style={s.cardLabel}>Head Office (Tax Nexus)</div>
              <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                {locationStr(settings.head_office.address) ?? '—'}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Section 2 — Tax Collection Settings (UI only)
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Tax Collection Settings</h2>

        <div style={s.settingsCard}>

          {/* Automatic tax toggle */}
          <div style={s.settingsRow}>
            <div style={s.settingsRowLeft}>
              <div style={s.settingsLabel}>Automatic Tax Collection</div>
              <div style={s.settingsSub}>
                Stripe Tax calculates the correct rates per transaction based on customer location.
                Toggle state is read from Stripe — manage it in the Stripe Dashboard under Tax.
              </div>
            </div>
            <div
              style={s.toggleTrack(taxEnabled)}
              role="switch"
              aria-checked={taxEnabled}
              aria-readonly="true"
              title={taxEnabled ? 'Enabled (manage in Stripe Dashboard)' : 'Disabled (manage in Stripe Dashboard)'}
            >
              <div style={s.toggleThumb(taxEnabled)} />
            </div>
          </div>

          <div style={s.divider} />

          {/* Country */}
          <div style={s.settingsRow}>
            <div style={s.settingsRowLeft}>
              <div style={s.settingsLabel}>Country</div>
              <div style={s.settingsSub}>Tax jurisdiction for this account.</div>
            </div>
            <div style={s.settingsValue}>🇺🇸 United States</div>
          </div>

          <div style={s.divider} />

          {/* States */}
          <div style={{ ...s.settingsRow, alignItems: 'flex-start' }}>
            <div style={s.settingsRowLeft}>
              <div style={s.settingsLabel}>State Registrations</div>
              <div style={s.settingsSub}>
                States where you are registered to collect sales tax.
              </div>
              <div style={{ ...s.settingsSub, marginTop: '6px', fontStyle: 'italic' }}>
                — Configured per-state in Stripe Dashboard
              </div>
            </div>
            <div style={{ ...s.settingsValue, color: '#9ca3af', fontSize: '13px' }}>
              Manage in Stripe →
            </div>
          </div>

          {/* Tax behavior (from settings, if present) */}
          {settings?.defaults && (
            <>
              <div style={s.divider} />
              <div style={{ ...s.settingsRow, alignItems: 'flex-start' }}>
                <div style={s.settingsRowLeft}>
                  <div style={s.settingsLabel}>Tax Behavior</div>
                  <div style={s.settingsSub}>
                    Inclusive — tax is built into the price.
                    Exclusive — tax is added on top of the price.
                  </div>
                </div>
                <div style={s.settingsValue}>
                  {settings.defaults.tax_behavior?.replace(/_/g, ' ') ?? '—'}
                </div>
              </div>
            </>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Section 3 — Tax Transactions
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Tax Transactions (Last 20 Paid Invoices)</h2>

        {errors.invoices && <ErrorBanner>Could not load invoices from Stripe.</ErrorBanner>}

        {invoices.length === 0 && !errors.invoices ? (
          <EmptyState>No paid invoices found.</EmptyState>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Tax</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Auto Tax</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const tax      = inv.tax ?? 0;
                  const total    = inv.amount_paid ?? 0;
                  const pretax   = total - tax;
                  const currency = inv.currency ?? 'usd';

                  const cust = typeof inv.customer === 'object' ? inv.customer : null;
                  const name = cust?.name ?? cust?.email ?? inv.customer_email ?? '—';
                  const loc  = locationStr(inv.customer_address ?? cust?.address);

                  const autoTax  = inv.automatic_tax;
                  const { bg, color } = autoTaxStyle(autoTax?.status);
                  const taxLabel = autoTax?.status?.replace(/_/g, ' ') ?? 'not applied';

                  return (
                    <tr key={inv.id}>
                      <td style={s.mono}>{fmtDate(inv.created)}</td>
                      <td style={{ ...s.truncate, maxWidth: '160px' }} title={name}>{name}</td>
                      <td style={{ fontSize: '13px', color: '#6b7280' }}>{loc ?? '—'}</td>
                      <td style={{ ...s.mono, textAlign: 'right', color: '#374151' }}>
                        {fmt(pretax, currency)}
                      </td>
                      <td style={{
                        ...s.mono,
                        textAlign: 'right',
                        color: tax > 0 ? '#059669' : '#9ca3af',
                        fontWeight: tax > 0 ? '700' : '400',
                      }}>
                        {tax > 0 ? fmt(tax, currency) : '—'}
                      </td>
                      <td style={{ ...s.mono, textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                        {fmt(total, currency)}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: bg,
                          color,
                          whiteSpace: 'nowrap',
                        }}>
                          {taxLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════
          Section 4 — Summary
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Summary</h2>

        {errors.invoices && (
          <ErrorBanner>Summary is based on partial data — could not load all invoices.</ErrorBanner>
        )}

        <div style={s.cardGrid}>

          <div style={{ ...s.card, borderTop: '3px solid #10b981' }}>
            <div style={s.cardLabel}>Total Tax Collected</div>
            <div style={{ ...s.cardAmount, color: '#059669' }}>{fmt(totalTax)}</div>
            <div style={s.cardSub}>
              {taxedInvoiceCount} invoice{taxedInvoiceCount !== 1 ? 's' : ''} with tax applied
            </div>
          </div>

          <div style={{ ...s.card, borderTop: '3px solid #6366f1' }}>
            <div style={s.cardLabel}>Total Revenue</div>
            <div style={{ ...s.cardAmount, color: '#4f46e5' }}>{fmt(totalRevenue)}</div>
            <div style={s.cardSub}>
              {invoices.length} paid invoice{invoices.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ ...s.card, borderTop: '3px solid #f59e0b' }}>
            <div style={s.cardLabel}>Pre-Tax Revenue</div>
            <div style={{ ...s.cardAmount, color: '#d97706' }}>{fmt(totalRevenue - totalTax)}</div>
            <div style={s.cardSub}>Revenue before tax</div>
          </div>

          <div style={{ ...s.card, borderTop: '3px solid #0ea5e9' }}>
            <div style={s.cardLabel}>Effective Tax Rate</div>
            <div style={{ ...s.cardAmount, color: '#0284c7' }}>
              {totalRevenue > 0
                ? `${((totalTax / totalRevenue) * 100).toFixed(2)}%`
                : '—'}
            </div>
            <div style={s.cardSub}>Avg tax as % of total collected</div>
          </div>

        </div>
      </section>

    </div>
  );
}

// ─── Small UI helpers (server-side, no state) ─────────────────────────────────

function EmptyState({ children }) {
  return (
    <div style={{
      padding: '32px',
      textAlign: 'center',
      color: '#9ca3af',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      fontSize: '14px',
    }}>
      {children}
    </div>
  );
}

function ErrorBanner({ children }) {
  return (
    <div style={{
      marginBottom: '16px',
      padding: '12px 16px',
      backgroundColor: '#fff7ed',
      border: '1px solid #fed7aa',
      borderRadius: '8px',
      color: '#c2410c',
      fontSize: '13px',
      fontWeight: '500',
    }}>
      ⚠️ {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  section: {
    marginBottom: '44px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
    marginTop: 0,
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '4px',
  },
  cardAmount: {
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    lineHeight: 1,
    marginTop: '10px',
    marginBottom: '8px',
  },
  cardSub: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '8px',
  },
  mono: {
    fontFamily: '"SF Mono", "Fira Code", monospace',
    fontSize: '13px',
  },
  truncate: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    color: '#374151',
  },
  settingsCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  settingsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    gap: '24px',
  },
  settingsRowLeft: {
    flex: 1,
    minWidth: 0,
  },
  settingsLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  settingsSub: {
    fontSize: '12px',
    color: '#9ca3af',
    lineHeight: 1.5,
  },
  settingsValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  divider: {
    height: '1px',
    backgroundColor: '#f3f4f6',
    margin: '0 24px',
  },
  toggleTrack: (on) => ({
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: on ? '#10b981' : '#d1d5db',
    position: 'relative',
    flexShrink: 0,
    cursor: 'default',
  }),
  toggleThumb: (on) => ({
    position: 'absolute',
    top: '2px',
    left: on ? '22px' : '2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  }),
};
