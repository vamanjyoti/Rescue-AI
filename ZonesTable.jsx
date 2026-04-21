export default function ZonesTable({ zones, city }) {
  function getLevel(score) {
    if (score >= 7)   return 'HIGH'
    if (score >= 4)   return 'MEDIUM'
    return 'LOW'
  }

  return (
    <div className="card">
      <div className="card-label">📍 Top High-Risk Zones — {city}</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="zones-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Severity</th>
              <th>Population</th>
              <th>Distance (km)</th>
              <th>Priority Score</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z, i) => {
              const score = z.priority_score ?? 0
              const level = getLevel(score)
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{z.Area}</td>
                  <td>{z.Disaster_Severity}</td>
                  <td>{z.Population_Density}</td>
                  <td>{z.Distance_km}</td>
                  <td className={`zone-score zone-${level}`}>{score.toFixed ? score.toFixed(2) : score}</td>
                  <td><span className={`priority-badge priority-${level}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>{level}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
