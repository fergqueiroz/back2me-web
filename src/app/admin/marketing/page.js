import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminMarketingPage({ searchParams }) {
  const supabase = createAdminClient();
  const rawParams = await searchParams;
  const daysFilter = parseInt(rawParams?.days || '30', 10);
  
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - daysFilter);

  // 1. Fetch sessions
  const { data: sessions, error } = await supabase
    .from('marketing_sessions')
    .select('channel, converted_user_id, created_at')
    .gte('created_at', dateLimit.toISOString());

  if (error) {
    return <div>Error loading marketing data: {error.message}</div>;
  }

  // 2. Compute Top Level Metrics
  const totalSessions = sessions.length;
  let totalConversions = 0;
  
  // Aggregate by channel
  const channelData = {};
  // Aggregate by day for the chart
  const timelineData = {};

  // Setup basic timeline array (fill zero for all days to avoid gaps)
  for (let i = daysFilter - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    timelineData[dayStr] = { sessions: 0, conversions: 0 };
  }

  sessions.forEach(s => {
    // Channel Aggregation
    const ch = s.channel || 'Direct';
    if (!channelData[ch]) channelData[ch] = { sessions: 0, conversions: 0 };
    channelData[ch].sessions += 1;
    
    // Timeline Aggregation
    const dayOnly = s.created_at.split('T')[0];
    if (timelineData[dayOnly]) {
      timelineData[dayOnly].sessions += 1;
    }

    if (s.converted_user_id) {
      totalConversions += 1;
      channelData[ch].conversions += 1;
      if (timelineData[dayOnly]) {
        timelineData[dayOnly].conversions += 1;
      }
    }
  });

  const conversionRate = totalSessions > 0 ? ((totalConversions / totalSessions) * 100).toFixed(1) : 0;
  const sortedChannels = Object.entries(channelData).sort((a, b) => b[1].sessions - a[1].sessions);

  // Prepare chart data limits
  const maxSessionsAnyDay = Math.max(...Object.values(timelineData).map(d => d.sessions), 1); // Avoid division by zero

  return (
    <div className="admin-page">
      <header className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>📈 Marketing & Trafeego</h2>
          <p>Visão geral de aquisição e conversões do site.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
          <Link 
            href="/admin/marketing?days=7"
            style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '500', borderRadius: '4px', textDecoration: 'none', background: daysFilter === 7 ? '#fff' : 'transparent', color: daysFilter === 7 ? '#0f172a' : '#64748b', boxShadow: daysFilter === 7 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}
          >
            Últimos 7 dias
          </Link>
          <Link 
            href="/admin/marketing?days=30"
            style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '500', borderRadius: '4px', textDecoration: 'none', background: daysFilter === 30 ? '#fff' : 'transparent', color: daysFilter === 30 ? '#0f172a' : '#64748b', boxShadow: daysFilter === 30 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}
          >
            Últimos 30 dias
          </Link>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{totalSessions}</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-label">Total Users (Conversions)</div>
          <div className="stat-value" style={{ color: '#059669' }}>{totalConversions}</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-label">Conversion Rate</div>
          <div className="stat-value">{conversionRate}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Left Side: Channel Table */}
        <div className="admin-card">
          <h3 style={{ marginTop: 0, fontSize: '15px', color: '#1e293b' }}>Traffic by Channel</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Sessions</th>
                <th>Users</th>
              </tr>
            </thead>
            <tbody>
              {sortedChannels.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8' }}>No traffic data yet.</td></tr>
              ) : (
                sortedChannels.map(([chName, stats]) => (
                  <tr key={chName}>
                    <td style={{ fontWeight: '500' }}>{chName}</td>
                    <td>{stats.sessions}</td>
                    <td style={{ color: '#059669', fontWeight: '500' }}>{stats.conversions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Side: Simple CSS Chart */}
        <div className="admin-card">
          <h3 style={{ marginTop: 0, fontSize: '15px', color: '#1e293b', marginBottom: '24px' }}>Sessions Over Time</h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '4px' }}>
            {Object.entries(timelineData).map(([dateLabel, stats]) => {
              const heightPercent = Math.max((stats.sessions / maxSessionsAnyDay) * 100, 2); // Minimum 2% height so empty days show a tiny bar
              return (
                <div 
                  key={dateLabel} 
                  title={`${dateLabel}: ${stats.sessions} sessions, ${stats.conversions} users`}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: '#e2e8f0', borderRadius: '4px 4px 0 0', position: 'relative', overflow: 'hidden' }}>
                    {/* Inner bar for conversions if there are any */}
                    {stats.conversions > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: `${(stats.conversions / Math.max(stats.sessions, 1)) * 100}%`,
                        backgroundColor: '#10b981',
                      }}></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
            <span>{Object.keys(timelineData)[0]}</span>
            <span>{Object.keys(timelineData)[Object.keys(timelineData).length - 1]}</span>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '2px' }}></div>
              <span>Sessions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
              <span>Conversions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
