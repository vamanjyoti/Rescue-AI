export default function AnalyticsTable({ zones, citySummary, loading }) {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading dataset analytics...
      </div>
    )
  }

  return (
    <>
      {/* City Summary Cards */}
      {citySummary.length > 0 && (
        <div className="card">
          <div className="card-label">🏙️ City Summary — Data-Driven Prioritization</div>
          <div className="city-grid" style={{ marginTop: '0.75rem' }}>
            {citySummary.map(c => (
              <div key={c.City} className="city-card">
                <div className="city-name">{c.City}</div>
                <div className="city-stat">Zones: <span>{c.total_zones}</span></div>
                <div className="city-stat">Avg Score: <span>{c.avg_score}</span></div>
                <div className="city-stat">High Priority: <span style={{ color: '#f87171' }}>{c.high_priority}</span></div>
                <div className="city-stat">Teams: <span>{c.total_teams}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Zones Table */}
      <div className="card">
        <div className="card-label">📋 Top Priority Zones (from 6,000-zone dataset)</div>
        {zones.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Start the Python analytics service to see zone data.
          </p>
        ) : (
          <div className="analytics-table-wrap" style={{ marginTop: '0.75rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>City</th>
                  <th>Severity</th>
                  <th>Population</th>
                  <th>Distance</th>
                  <th>Weather</th>
                  <th>Teams</th>
                  <th>Score</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.Area}>
                    <td>{z.Area}</td>
                    <td>{z.City}</td>
                    <td>{z.Disaster_Severity}</td>
                    <td>{z.Population_Density}</td>
                    <td>{z.Distance_km} km</td>
                    <td>{z.Weather_Risk}</td>
                    <td>{z.Available_Teams}</td>
                    <td style={{ color: '#f97316', fontWeight: 600 }}>{z.Priority_Score}</td>
                    <td>
                      <span className={`priority-badge priority-${z.Priority_Level}`}
                        style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                        {z.Priority_Level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
