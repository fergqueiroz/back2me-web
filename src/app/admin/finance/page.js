import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(cents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function txnLabel(type) {
  const map = {
    charge: 'Payment received',
    payment: 'Payment received',
    refund: 'Refund issued',
    payment_refund: 'Refund issued',
    payout: 'Payout to bank',
    payout_cancel: 'Payout cancelled',
    payout_failure: 'Payout failed',
    adjustment: 'Adjustment',
    stripe_fee: 'Stripe fee',
    network_cost: 'Network cost',
    application_fee: 'Platform fee',
    application_fee_refund: 'Platform fee refund',
  };
  return map[type] || type.replace(/_/g, ' ');
}

function txnTypeColors(type) {
  if (['charge', 'payment', 'contribution'].includes(type))
    return { backgroundColor: '#d1fae5', color: '#065f46' };
  if (['payout', 'stripe_fee', 'network_cost', 'adjustment'].includes(type))
    return { backgroundColor: '#f3f4f6', color: '#4b5563' };
  return { backgroundColor: '#fee2e2', color: '#991b1b' };
}

function badge(status) {
  const palette = {
    available:      ['#d1fae5', '#065f46'],
    pending:        ['#fef3c7', '#92400e'],
    paid:           ['#d1fae5', '#065f46'],
    in_transit:     ['#dbeafe', '#1e40af'],
    failed:         ['#fee2e2', '#991b1b'],
    canceled:       ['#f3f4f6', '#4b5563'],
    needs_response: ['#fee2e2', '#991b1b'],
    under_review:   ['#fef3c7', '#92400e'],
    won:            ['#d1fae5', '#065f46'],
    lost:           ['#fee2e2', '#991b1b'],
    warning_needs_response: ['#fef3c7', '#92400e'],
    charge_refunded: ['#f3f4f6', '#4b5563'],
  };
  const [bg, color] = palette[status] ?? ['#f3f4f6', '#6b7280'];
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    backgroundColor: bg,
    color,
  };
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getFinanceData() {
  const supabase = createAdminClient();

  const [
    balanceResult,
    txnsResult,
    payoutsResult,
    chargesResult,
    disputesResult,
    shipmentsResult,
  ] = await Promise.allSettled([
    stripe.balance.retrieve(),
    stripe.balanceTransactions.list({ limit: 30 }),
    stripe.payouts.list({ limit: 10 }),
    stripe.charges.list({ limit: 40 }),
    stripe.disputes.list({ limit: 20 }),
    supabase
      .from('shipments')
      .select('final_price, markup_amount, base_cost, status, created_at')
      .neq('status', 'awaiting_owner_payment')
      .order('created_at', { ascending: false }),
  ]);

  const balance     = balanceResult.status     === 'fulfilled' ? balanceResult.value          : null;
  const transactions = txnsResult.status       === 'fulfilled' ? txnsResult.value.data        : [];
  const payouts     = payoutsResult.status     === 'fulfilled' ? payoutsResult.value.data     : [];
  const charges     = chargesResult.status     === 'fulfilled' ? chargesResult.value.data     : [];
  const disputes    = disputesResult.status    === 'fulfilled' ? disputesResult.value.data    : [];
  const shipments   = shipmentsResult.status   === 'fulfilled' ? (shipmentsResult.value.data ?? []) : [];

  const failedCharges = charges.filter(c => c.status === 'failed');

  const shippingRevenue = {
    total:  shipments.reduce((s, r) => s + parseFloat(r.final_price   ?? 0), 0),
    markup: shipments.reduce((s, r) => s + parseFloat(r.markup_amount ?? 0), 0),
    count:  shipments.length,
  };

  return {
    balance,
    transactions,
    payouts,
    latestPayout: payouts[0] ?? null,
    failedCharges,
    disputes,
    shippingRevenue,
    errors: {
      balance:      balanceResult.status      === 'rejected',
      transactions: txnsResult.status         === 'rejected',
      payouts:      payoutsResult.status      === 'rejected',
      charges:      chargesResult.status      === 'rejected',
      disputes:     disputesResult.status     === 'rejected',
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminFinancePage() {
  const {
    balance,
    transactions,
    payouts,
    latestPayout,
    failedCharges,
    disputes,
    shippingRevenue,
    errors,
  } = await getFinanceData();

  const available = balance?.available?.[0];
  const pending   = balance?.pending?.[0];

  return (
    <div className="admin-page">

      {/* ── Header ── */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Finance</h1>
        <p className="admin-page-subtitle">
          Live financial overview powered by Stripe · Internal use only
        </p>
      </div>

      {/* ══════════════════════════════════════════════
          Section 1 — Balance Overview
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Balance Overview</h2>

        {errors.balance && <ErrorBanner>Could not load Stripe balance. Check your Stripe key.</ErrorBanner>}

        <div style={s.cardGrid}>

          {/* Available */}
          <div style={{ ...s.card, borderTop: '3px solid #10b981' }}>
            <div style={s.cardLabel}>Available Balance</div>
            <div style={{ ...s.cardAmount, color: '#059669' }}>
              {available ? fmt(available.amount, available.currency) : '—'}
            </div>
            <div style={s.cardSub}>
              {available?.currency?.toUpperCase() ?? 'USD'} · Ready to pay out
            </div>
          </div>

          {/* Pending */}
          <div style={{ ...s.card, borderTop: '3px solid #f59e0b' }}>
            <div style={s.cardLabel}>Pending Balance</div>
            <div style={{ ...s.cardAmount, color: '#d97706' }}>
              {pending ? fmt(pending.amount, pending.currency) : '—'}
            </div>
            <div style={s.cardSub}>Processing · arrives in 2–7 business days</div>
          </div>

          {/* Latest Payout */}
          <div style={{ ...s.card, borderTop: '3px solid #6366f1' }}>
            <div style={s.cardLabel}>Latest Payout</div>
            <div style={{ ...s.cardAmount, color: '#4f46e5' }}>
              {latestPayout ? fmt(latestPayout.amount, latestPayout.currency) : '—'}
            </div>
            <div style={s.cardSub}>
              {latestPayout ? (
                <>
                  <span style={badge(latestPayout.status)}>
                    {latestPayout.status.replace(/_/g, ' ')}
                  </span>
                  &nbsp;·&nbsp;
                  {fmtDate(latestPayout.arrival_date ?? latestPayout.created)}
                </>
              ) : 'No payouts yet'}
            </div>
          </div>

          {/* Shipping Revenue (Supabase) */}
          <div style={{ ...s.card, borderTop: '3px solid #0ea5e9' }}>
            <div style={s.cardLabel}>Shipping Revenue</div>
            <div style={{ ...s.cardAmount, color: '#0284c7' }}>
              ${shippingRevenue.total.toFixed(2)}
            </div>
            <div style={s.cardSub}>
              ${shippingRevenue.markup.toFixed(2)} margin · {shippingRevenue.count} paid shipments
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Section 2 — Recent Transactions
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Recent Transactions</h2>

        {errors.transactions && <ErrorBanner>Could not load Stripe transactions.</ErrorBanner>}

        {transactions.length === 0 && !errors.transactions ? (
          <EmptyState>No transactions yet.</EmptyState>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Gross</th>
                  <th style={{ textAlign: 'right' }}>Fee</th>
                  <th style={{ textAlign: 'right' }}>Net</th>
                  <th>Status</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id}>
                    <td style={s.mono}>{fmtDate(txn.created)}</td>
                    <td>
                      <span style={{ ...s.typeTag, ...txnTypeColors(txn.type) }}>
                        {txnLabel(txn.type)}
                      </span>
                    </td>
                    <td style={s.truncate} title={txn.description ?? ''}>
                      {txn.description || '—'}
                    </td>
                    <td style={{ ...s.mono, textAlign: 'right', color: txn.amount >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>
                      {fmt(txn.amount, txn.currency)}
                    </td>
                    <td style={{ ...s.mono, textAlign: 'right', color: '#9ca3af' }}>
                      {txn.fee > 0 ? `−${fmt(txn.fee, txn.currency)}` : '—'}
                    </td>
                    <td style={{ ...s.mono, textAlign: 'right', fontWeight: '700', color: txn.net >= 0 ? '#059669' : '#dc2626' }}>
                      {fmt(txn.net, txn.currency)}
                    </td>
                    <td>
                      <span style={badge(txn.status)}>{txn.status}</span>
                    </td>
                    <td style={{ ...s.mono, fontSize: '11px', color: '#9ca3af' }}>
                      {txn.id.slice(0, 20)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════
          Section 3 — Payouts
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Payouts</h2>

        {errors.payouts && <ErrorBanner>Could not load Stripe payouts.</ErrorBanner>}

        {payouts.length === 0 && !errors.payouts ? (
          <EmptyState>No payouts yet.</EmptyState>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Initiated</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                  <th>Arrival Date</th>
                  <th>Payout ID</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p.id}>
                    <td style={s.mono}>{fmtDate(p.created)}</td>
                    <td style={{ ...s.mono, textAlign: 'right', color: '#4f46e5', fontWeight: '700' }}>
                      {fmt(p.amount, p.currency)}
                    </td>
                    <td>
                      <span style={badge(p.status)}>{p.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={s.mono}>
                      {p.arrival_date ? fmtDate(p.arrival_date) : '—'}
                    </td>
                    <td style={{ ...s.mono, fontSize: '11px', color: '#9ca3af' }}>{p.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════
          Section 4 — Tax Collection (Placeholder)
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Tax Collection</h2>
        <div style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={s.cardLabel}>Tax Collection Status</div>
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ ...badge('canceled'), backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                Not Configured
              </span>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                Stripe Tax is not yet enabled for this account.
              </span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#9ca3af' }}>
              When configured, automatic tax collection will apply to subscriptions and one-time payments.
            </div>
          </div>
          <button style={s.disabledBtn} disabled>
            Configure Tax Collection
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Section 5 — Security Alerts
      ══════════════════════════════════════════════ */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Security Alerts</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Failed Payments */}
          <div style={s.alertBox}>
            <div style={s.alertHeader}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span style={s.alertTitle}>Failed Payments</span>
              <span style={{ ...badge(failedCharges.length > 0 ? 'failed' : 'available'), marginLeft: 'auto' }}>
                {failedCharges.length}
              </span>
            </div>

            {errors.charges && (
              <div style={{ marginTop: '12px', color: '#9ca3af', fontSize: '13px' }}>
                Could not load charge data from Stripe.
              </div>
            )}

            {!errors.charges && failedCharges.length === 0 && (
              <div style={s.allClear}>✓ No failed payments</div>
            )}

            {failedCharges.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {failedCharges.slice(0, 5).map(c => (
                  <div key={c.id} style={s.alertRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
                        {c.id.slice(0, 22)}…
                      </span>
                      <span style={{ fontWeight: '700', color: '#dc2626' }}>
                        {fmt(c.amount, c.currency)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      {fmtDate(c.created)} · {c.failure_message ?? c.failure_code ?? 'Unknown reason'}
                    </div>
                  </div>
                ))}
                {failedCharges.length > 5 && (
                  <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', paddingTop: '4px' }}>
                    +{failedCharges.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Disputed Payments */}
          <div style={s.alertBox}>
            <div style={s.alertHeader}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <span style={s.alertTitle}>Disputed Payments</span>
              <span style={{ ...badge(disputes.length > 0 ? 'failed' : 'available'), marginLeft: 'auto' }}>
                {disputes.length}
              </span>
            </div>

            {errors.disputes && (
              <div style={{ marginTop: '12px', color: '#9ca3af', fontSize: '13px' }}>
                Could not load dispute data from Stripe.
              </div>
            )}

            {!errors.disputes && disputes.length === 0 && (
              <div style={s.allClear}>✓ No disputed payments</div>
            )}

            {disputes.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {disputes.slice(0, 5).map(d => (
                  <div key={d.id} style={{ ...s.alertRow, borderLeftColor: '#7c3aed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
                        {(d.charge ?? d.id).toString().slice(0, 22)}…
                      </span>
                      <span style={{ fontWeight: '700', color: '#dc2626' }}>
                        {fmt(d.amount, d.currency)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={badge(d.status)}>{d.status.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {d.reason.replace(/_/g, ' ')} · {fmtDate(d.created)}
                      </span>
                    </div>
                  </div>
                ))}
                {disputes.length > 5 && (
                  <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', paddingTop: '4px' }}>
                    +{disputes.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Suspicious Activity Placeholder */}
        <div style={{ ...s.alertBox, marginTop: '20px', opacity: 0.65 }}>
          <div style={s.alertHeader}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <span style={s.alertTitle}>Suspicious Activity Detection</span>
            <span style={{ ...badge('pending'), backgroundColor: '#f3f4f6', color: '#9ca3af', marginLeft: 'auto' }}>
              Coming Soon
            </span>
          </div>
          <div style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af', lineHeight: '1.6' }}>
            Automated detection for unusual transaction patterns, velocity spikes, and geographic anomalies.
            SMS alerts are not yet configured.
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
    marginBottom: '10px',
  },
  cardAmount: {
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
    lineHeight: 1,
  },
  cardSub: {
    fontSize: '12px',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
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
  typeTag: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  disabledBtn: {
    padding: '10px 20px',
    backgroundColor: '#1f2937',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'not-allowed',
    opacity: 0.45,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  alertBox: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  alertTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111827',
  },
  allClear: {
    marginTop: '14px',
    padding: '12px',
    backgroundColor: '#d1fae5',
    borderRadius: '6px',
    color: '#065f46',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
  },
  alertRow: {
    padding: '10px 12px',
    backgroundColor: '#fff7ed',
    borderRadius: '6px',
    borderLeft: '3px solid #f97316',
  },
};
