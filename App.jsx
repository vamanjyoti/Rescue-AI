import { useState } from 'react'
import DisasterForm from './components/DisasterForm'
import ResultsDashboard from './components/ResultsDashboard'

export default function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <nav className="navbar">
        <span style={{ fontSize: '1.6rem' }}>🚨</span>
        <div>
          <h1>RescueAI</h1>
        </div>
        <div className="navbar-right">
          <span className="nav-badge">🤖 3 Agents Active</span>
          <span className="nav-badge">📊 6000 Zones Loaded</span>
          <span className="nav-badge" style={{ color: '#4ade80', borderColor: '#4ade80' }}>● Live</span>
        </div>
      </nav>

      <div className="main-layout">
        <DisasterForm setResults={setResults} setLoading={setLoading} loading={loading} />
        <ResultsDashboard results={results} loading={loading} />
      </div>
    </>
  )
}
